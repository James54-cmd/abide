import { gql } from "@apollo/client";

export const SAVE_BIBLE_PROGRESS_MUTATION = gql`
  mutation SaveBibleProgress($input: SaveBibleProgressInput!) {
    saveBibleProgress(input: $input) {
      translation
      bookId
      chapterId
      verse
      fontSize
      fontFamily
      lineSpacing
    }
  }
`;
