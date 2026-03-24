import { gql } from "@apollo/client";

export const SAVE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation SaveBibleHighlight($input: SaveBibleHighlightInput!) {
    saveBibleHighlight(input: $input) {
      id
      verseStart
      verseEnd
      color
    }
  }
`;

export const DELETE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation DeleteBibleHighlight($id: String!) {
    deleteBibleHighlight(id: $id)
  }
`;
