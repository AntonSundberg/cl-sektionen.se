import functions, { logger } from "firebase-functions";
import fetch from "node-fetch";

export const createPost = functions
  .region("europe-west1")
  .firestore.document("posts/{postId}")
  .onCreate((context) => {
    logger.log("Post skapad");

    // Revalidate:ar hemsidan
    revalidate("all");
    revalidate("post", context.params.postId);

    // Skickar notis till alla som följer eventuella taggar

    return 0;
  });

export const updatePost = functions
  .region("europe-west1")
  .firestore.document("posts/{postId}")
  .onUpdate((change, context) => {
    logger.log("Post uppdaterad");

    // Revalidate:ar hemsidan
    revalidate("all");
    revalidate("post", context.params.postId);

    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (!newValue.image) {
      // Om det saknas en bild radera en eventuell tidigare bild
    } else if (newValue.image !== previousValue.image) {
      // Kollar om det är en ny bild i så fall: Ta bort den förra bilden
    }

    // Om tid ändras skicka notis om det

    return 0;
  });

export const deletePost = functions
  .region("europe-west1")
  .firestore.document("posts/{postId}")
  .onDelete((context) => {
    logger.log("Post borttagen");

    // Revalidate:ar hemsidan
    revalidate("all");
    revalidate("post", context.params.postId);

    // Ta bort eventuell kopplad bild

    // Rensa alla notis prenumerationer

    return 0;
  });

function revalidate(page = "all", postId = "") {
  const url = `${process.env.DOMAIN}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}&page=${page}&postId=${postId}`;
  const headers = {
    "Content-Type": "application/json",
    "method": "GET",
  };
  logger.log("Sending revalidation request");
  fetch(url, headers)
    .then((res) => {
      if (res.ok) {
        logger.log("Revalidation successful");
      } else {
        logger.warn("Revalidation unsuccessful", res.statusText);
      }
    })
    .catch((error) => logger.error(error));
}

