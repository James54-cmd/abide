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
        testament
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
        fontSize
        fontFamily
        lineSpacing
      }
    }
  }
`;

export const BIBLE_FAVORITES_QUERY = gql`
  query BibleFavorites {
    bibleFavorites {
      id
      translation
      bookId
      chapterId
      verseStart
      verseEnd
      verseReference
      verseText
      createdAt
      updatedAt
    }
  }
`;
