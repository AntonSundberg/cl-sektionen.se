import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

import TextField from "./form components/TextField";
import InfoBox from "./form components/InfoBox";
import Label from "./form components/Label";
import { create_id } from "../../utils/postUtils";
import { useAuth } from "../../context/AuthContext";

// Taggar som kan väljas
import { INFOTAGS, EVENTSTAGS, COMMONTAGS } from "../../constants/tags";
import { all_committees } from "../../constants/committees-data";

import styles from "../../styles/personalrummet/publicera.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { faStarOfLife } from "@fortawesome/free-solid-svg-icons";

export default function PostForm({ onSubmit, prefill, editMode = false }) {
  const [title, setTitle] = useState(prefill.title);
  const subtitle = useRef(null);
  const [image, setImage] = useState(prefill.image);
  const body = useRef(prefill.body); // useRef för att useState gör att bilden laddas om varje gång man skriver
  const [tags, setTags] = useState(prefill.tags);
  const [startDateTime, setStartDateTime] = useState(prefill.startDateTime);
  const [endDateTime, setEndDateTime] = useState(prefill.endDateTime);
  const [visibility, setVisibility] = useState(prefill.visibility);
  const [meetingNumber, setMeetingNumber] = useState(1);
  const author = useRef(null);
  const [authorCommittee, setAuthorCommittee] = useState(prefill.authorCommittee); // Admins kan ändra vilken nämnd inlägget tillhör
  const [link, setLink] = useState(prefill.link);

  const [error, setError] = useState("");

  const [type, setType] = useState("");
  const publishInCalendar = useRef(null);
  const sendNotification = useRef(null);

  const { userData } = useAuth();

  // Sätter typ och tags från prefill
  useEffect(() => {
    if (prefill.type) {
      // Null för att handleSetType tar in ett element på första parametern
      handleSetType(null, prefill.type);
    }

    // Markera de tidigare valda taggarna
    let newTags = {};
    for (let tag of prefill.tags) {
      newTags[tag] = true;
    }
    setTags((tags) => ({ ...tags, ...newTags }));
  }, [prefill.tags, prefill.type]);

  // Uppdaterar författare input med prefill
  useEffect(() => {
    if (author.current) {
      author.current.value = prefill.author;
    }
  }, [prefill.author, author]);

  // Uppdaterar författare input med prefill
  useEffect(() => {
    setAuthorCommittee(prefill.authorCommittee);
  }, [prefill.authorCommittee]);

  // Om det är ett SM eller StyM så uppdatera länken efter typ och mötes nummer
  useEffect(() => {
    if (editMode) return; // Om vi är i editMode så ska inte länken uppdateras
    if (tags["SM"]) {
      setLink(create_id({ number: meetingNumber }, "SM"));
    } else if (tags["StyM"]) {
      setLink(create_id({ number: meetingNumber }, "StyM"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingNumber, tags]);

  // Om det inte är ett SM eller StyM så uppdateras länken efter titeln
  useEffect(() => {
    if (editMode) return; // Om vi är i editMode så ska inte länken uppdateras
    if (!(tags["SM"] || tags["StyM"])) {
      setLink(create_id(title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, tags]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Kollar om alla inputs är ok
    let validation = validate_inputs();
    if (validation != "ok") {
      setError(validation);
      return;
    }

    let selectedTags = [];
    Object.entries(tags).forEach((pair) => {
      if (pair[1]) {
        selectedTags.push(pair[0]);
      }
    });

    let formData = {
      title,
      subtitle: subtitle.current.value,
      image,
      body: body.current,
      author: author.current.value,
      authorCommittee,
      visibility,
      tags: selectedTags,
      type,
      link,
      publishInCalendar: publishInCalendar?.current?.checked,
      sendNotification: sendNotification?.current?.checked,
    };

    // Om det är ett event skickar vi med start- och sluttid
    if (type == "event") {
      formData.startDateTime = startDateTime;
      formData.endDateTime = endDateTime;
    }

    onSubmit(formData);
    setError("");
  };

  // Validera alla inputs
  const validate_inputs = () => {
    if (title.length > 60) {
      return "Titeln får max vara 60 tecken lång.";
    }
    if (title.length < 3) {
      return "Titeln ska minst vara 3 tecken lång.";
    }
    if (subtitle.current.value.length > 120) {
      return "Subtiteln får max vara 120 tecken lång.";
    }

    if (body.current.length < 3 + 7) {
      // + 7 för att de minsta taggarna är 7 tecken ""<p></p>"
      return "Du måste ange en text med minst 3 tecken.";
    }

    if (author.current.value.length < 2) {
      return "Du måste ange en författare med minst 2 tecken.";
    }

    // Image check
    if (image.name) {
      if (image.size > 0.8 * 1024 * 1024) {
        return "Filstorleken på bilden får inte vara större än 0.8 MB";
      }
      const available_formats = ["jpeg", "jpg", "webp", "avif", "png", "gif"];
      if (!available_formats.includes(image.name.split(".")[1].toLowerCase())) {
        return "Filformatet på bilden måste vara något av följande: " + available_formats.join(" ");
      }
    }

    //Kollar start- och sluttider
    try {
      if (new Date(startDateTime) > new Date(endDateTime)) {
        return "Du kan inte ange ett slutdatum tidigare än startdatumet!";
      }
    } catch {
      return "Publiceringsdatumet måste vara på formen åååå-mm-dd HH:mm";
    }

    // Om inget är fel
    return "ok";
  };

  // När användaren klickar på en tagg
  const handleTagClick = (e) => {
    e.preventDefault();
    let tag = e.target.innerHTML;
    let selected = e.target.classList.contains("selected");

    // Om det är SM eller StyM ska alla andra tagga rensas
    if (tag === "SM" || tag === "StyM") {
      setTags((tags) => {
        // Sätter alla andra taggar till false
        Object.keys(tags).forEach((key) => {
          tags[key] = false;
        });

        // Returnerar alla taggar som false förutom den nya SM/StyM
        return { ...tags, ...{ [tag]: !selected } };
      });

      return;
    }

    // Rensar link input om SM eller StyM var valda tidigare
    if (tags["SM"] || tags["StyM"]) {
      setLink("");
    }

    // Kopiera förra statet och skriver över värdet på den valda tagen
    if (type == "event") {
      // Tar bort SM om StyM om de var valda
      setTags((tags) => ({ ...tags, ...{ SM: false, StyM: false, [tag]: !selected } }));
    } else {
      setTags((tags) => ({ ...tags, ...{ [tag]: !selected } }));
    }
  };

  // När användaren väljer typ av inlägg information/event
  const handleSetType = (e, type) => {
    if (e) {
      e.preventDefault();
    }
    setType(type);

    // Ger varje tag ett på/av värde (av från början)
    const infoTags = {};
    INFOTAGS.forEach((tag) => {
      infoTags[tag] = false;
    });

    const eventTags = {};
    EVENTSTAGS.forEach((tag) => {
      eventTags[tag] = false;
    });

    const commonTags = {};
    COMMONTAGS.forEach((tag) => {
      commonTags[tag] = false;
    });

    if (type === "information") {
      setTags({ ...infoTags, ...commonTags });
    } else if (type === "event") {
      setTags({ ...eventTags, ...commonTags });
    }
  };

  // Ändrar värdet så att det är en korrekt länk
  const handleLinkInput = (txt) => {
    if (txt.endsWith(" ")) {
      // Låter användaren skriva mellan slag som om de lägger till fler tecken blir ett -
      setLink(create_id(txt) + " ");
    } else if (txt.endsWith("-")) {
      // Låter användaren skriva in - som försvinner om inga fler tecken läggs till
      setLink(create_id(txt) + "-");
    } else {
      setLink(create_id(txt));
    }
  };

  // Komponenter
  const ImageInput = () => {
    const available_formats = ["jpeg", "jpg", "webp", "avif", "png", "gif"];
    return (
      <>
        {image.name && (
          <>
            <div className="image-file">
              {/* Om image är en sträng så är det en länk och då plockar vi ut filnamnet */}
              {image.name}{" "}
              <FontAwesomeIcon
                icon={faTrashCan}
                onClick={() => setImage({ name: undefined, url: undefined })}
              />
            </div>
            <div className="image-meta">
              <span
                className={`image-format ${
                  available_formats.includes(image.name.split(".")[1].toLowerCase())
                    ? "accepted"
                    : "error"
                }`}>
                Format: {image.name.split(".")[1].toLowerCase()}
              </span>
              <span
                className={`image-size ${image.size < 0.8 * 1024 * 1024 ? "accepted" : "error"}`}>
                Storlek: {Math.round((image.size / 1024) * 10) / 10} kB
              </span>
            </div>
            <p>
              <i>Så här kommer bilden se ut i flödet</i>
            </p>
            {/* Om det är en sträng så är det länken från firebase annars skapa en lokal url */}
            <Image
              id="frame"
              src={image.url ? image.url : URL.createObjectURL(image)}
              width={120}
              height={100}
              alt="Förhandsvisning"
            />
          </>
        )}
        {!image.name && <input type="file" onChange={(e) => setImage(e.target.files[0])} />}
      </>
    );
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Välj vilken typ av inlägg du ska göra:</label>
        <div className="type-container">
          <button
            disabled={editMode}
            onClick={(e) => handleSetType(e, "information")}
            className={type === "information" ? "selected" : ""}>
            Information
          </button>
          <button
            disabled={editMode}
            onClick={(e) => handleSetType(e, "event")}
            className={type === "event" ? "selected" : ""}>
            Event
          </button>
        </div>
        {type && (
          <div>
            {/* Tagg väljare */}
            {(!editMode || !(tags["SM"] || tags["StyM"])) && (
              <>
                <label>
                  Kategorier:
                  <FontAwesomeIcon icon={faStarOfLife} rotation={90} className={styles.required} />
                </label>
                <div className="tag-container">
                  <div className="tag-selector">
                    {Object.keys(tags).map((tag, index) => {
                      return (
                        <button
                          className={`tag ${tags[tag] ? "selected" : ""}`}
                          name={tag}
                          key={index}
                          onClick={handleTagClick}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  {(tags["SM"] || tags["StyM"]) && (
                    <div className="meeting-input">
                      <label>
                        Mötes nummer:
                        <FontAwesomeIcon
                          icon={faStarOfLife}
                          rotation={90}
                          className={styles.required}
                        />
                      </label>
                      <input
                        required
                        type="number"
                        value={meetingNumber}
                        min={0}
                        max={10}
                        width="100px"
                        onChange={(e) => setMeetingNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <Label required>Titel:</Label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />

            <Label>Undertitel:</Label>
            <input type="text" ref={subtitle} defaultValue={prefill.subtitle} />

            <Label>Bild:</Label>
            <ImageInput />

            <Label required>Inlägg:</Label>
            <TextField fieldRef={body} defaultValue={prefill.body} />

            <Label required>Författare:</Label>
            <input type="text" required ref={author} defaultValue={prefill.author} />

            {userData?.permission === "admin" && (
              <>
                <Label>
                  Nämnd:
                  <InfoBox
                    text="Lägger du upp ett inlägg åt en annan nämnd kan du ändra så att de senare kan
                      redigera det. Denna funktionen finns endast för dig som har admin-behörighet."
                  />
                </Label>
                <select
                  onChange={(e) => {
                    setAuthorCommittee(e.target.value);
                  }}
                  defaultValue={prefill.committee || userData.committee}>
                  {all_committees.map((committee, idx) => {
                    return (
                      <option value={committee.id} key={idx}>
                        {committee.name}
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {type === "event" && (
              <>
                <div className="date-input">
                  <div>
                    <Label required>Start:</Label>
                    <input
                      type="datetime-local"
                      required
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      min={editMode ? "" : new Date().toLocaleString().substring(0, 16)}
                    />
                  </div>
                  <div>
                    <Label required>Slut:</Label>
                    <input
                      type="datetime-local"
                      required
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      min={startDateTime}
                    />
                  </div>
                </div>
              </>
            )}

            <div className={"visibility-input"}>
              <Label>Synlighet:</Label>
              <div
                className={`visibility-button ${visibility === "public" ? "active" : ""}`}
                onClick={() => setVisibility(visibility === "public" ? "private" : "public")}>
                <FontAwesomeIcon icon={visibility !== "public" ? faEyeSlash : faEye} />
              </div>
              <p>
                {visibility === "public"
                  ? "Visas på startsidan och aktuelltsidan."
                  : "Kan endast ses i personalrummet."}
              </p>
            </div>

            {/* URL */}
            <Label>
              Url:
              <InfoBox text='Länken måste vara unik och får bara innehålla a-z, 0-9 samt "-".' />
            </Label>
            <input
              disabled={editMode || tags.StyM || tags.SM}
              type="text"
              value={link}
              placeholder={"Ex: sm-1-23 ger länken /aktuellt/sm-1-23"}
              onChange={(e) => handleLinkInput(e.target.value)}
            />

            {/* Kalender */}
            {!editMode && type === "event" && (
              <>
                <div className="calender-input">
                  <label htmlFor="calendar">Lägg till i sektionskalendern:</label>
                  <input
                    id="calendar"
                    type="checkbox"
                    ref={publishInCalendar}
                    defaultChecked={false}
                  />
                </div>
              </>
            )}

            {!editMode && (
              <>
                <div className="calender-input">
                  <label htmlFor="notis">Skicka notis:</label>
                  <input id="notis" type="checkbox" ref={sendNotification} defaultChecked={true} />
                </div>
              </>
            )}

            <button className={styles.submitButton}>{editMode ? "Uppdatera" : "Publicera"}</button>
          </div>
        )}
      </form>
      {error && <p>{error}</p>}
    </div>
  );
}
