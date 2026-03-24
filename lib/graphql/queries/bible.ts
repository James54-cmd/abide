import { gql } from "@apollo/client";

export const BIBLE_BOOTSTRAP_QUERY = gql`
  query BibleBootstrap(
    $translation: String
    $preferredBookId: String
    $preferredChapterId: String
  ) {
    bibleBootstrap(
      translation: $translation
      preferredBookId: $preferredBookId
      preferredChapterId: $preferredChapterId
    ) {
      translation
      books {
        id
        name
      }
      selectedBookId
      chapters {
        id
        number
      }
      selectedChapterId
      verses {
        reference
        text
        verse
      }
      progress {
        translation
        bookId
        chapterId
        verse
      }
    }
  }
`;

export const BIBLE_ANNOTATIONS_QUERY = gql`
  query BibleAnnotations($translation: String!, $bookId: String!, $chapterId: String!) {
    bibleAnnotations(translation: $translation, bookId: $bookId, chapterId: $chapterId) {
      highlights {
        id
        verseStart
        verseEnd
        color
      }
      notes {
        id
        verseStart
        verseEnd
        content
        createdAt
      }
    }
  }
`;
