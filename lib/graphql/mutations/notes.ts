import { gql } from "@apollo/client";

export const DELETE_BIBLE_NOTE_MUTATION = gql`
  mutation DeleteBibleNote($id: String!) {
    deleteBibleNote(id: $id)
  }
`;

export const SAVE_BIBLE_NOTE_MUTATION = gql`
  mutation SaveBibleNote($input: SaveBibleNoteInput!) {
    saveBibleNote(input: $input) {
      id
      verseStart
      verseEnd
      content
      createdAt
    }
  }
`;
