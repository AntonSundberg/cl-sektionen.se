import React from "react";
import MarkdownRender from "../../components/MarkdownRender";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import BackButton from "../../components/BackButton";
import CustomHead from "../../components/CustomHead";

import { songStyles } from "../../styles/sangbok.module.css";

export default function Sang({ songData, content }) {
  return (
    <>
      <CustomHead
        metaTitle={`${songData.title} | Sektionen för Civilingenjör och Lärare`}
        description={"Sektionens digitala sångbok."}
        url={"https://www.cl-sektionen.se/songbok" + songData.href}
      />
      <div id="contentbody">
        <article className={songStyles}>
          <BackButton page={"sangbok"}>Sångboken</BackButton>
          <MarkdownRender mdData={content} />
        </article>
      </div>
    </>
  );
}

export async function getStaticProps(context) {
  // Skickar med filnamnet som en prop vilket gör att next kan serverside rendera alla reseberättelser
  const { params } = context;

  // Hämtar all text
  const content = readFileSync(`public/content/sangbok/${params.sang}.md`, "utf8");

  // Hämtar sång data från json
  const songsDataFile = readFileSync(`public/content/data/sangbok-index.json`, "utf8");
  const songsList = JSON.parse(songsDataFile);

  const songData = songsList.find((song) => song.href === `/${params.sang}`);

  return {
    props: { songData, content: JSON.parse(JSON.stringify(content)) }, // will be passed to the page component as props
  };
}

export async function getStaticPaths() {
  // Hämtar alla filnamn från mappen med alla sånger
  const PATH = join(process.cwd(), "public/content/sangbok");
  const paths = readdirSync(PATH)
    .map((path) => path.replace(/\.mdx?$/, ""))
    .map((sangid) => ({ params: { sang: sangid } }));

  return {
    paths,
    fallback: false, // can also be true or 'blocking'
  };
}
