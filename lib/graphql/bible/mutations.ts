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

export const SAVE_BIBLE_NOTE_MUTATION = gql`
  mutation SaveBibleNote($input: SaveBibleNoteInput!) {
    saveBibleNote(input: $input) {
      id
      translation
      bookId
      chapterId
      verseStart
      verseEnd
      content
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BIBLE_NOTE_MUTATION = gql`
  mutation DeleteBibleNote($id: String!) {
    deleteBibleNote(id: $id)
  }
`;

export const SAVE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation SaveBibleHighlight($input: SaveBibleHighlightInput!) {
    saveBibleHighlight(input: $input) {
      id
      translation
      bookId
      chapterId
      verseStart
      verseEnd
      color
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation DeleteBibleHighlight($id: String!) {
    deleteBibleHighlight(id: $id)
  }
`;

export const BULK_SAVE_BIBLE_HIGHLIGHTS_MUTATION = gql`
  mutation BulkSaveBibleHighlights($inputs: [SaveBibleHighlightInput!]!) {
    bulkSaveBibleHighlights(inputs: $inputs) {
      id
      translation
      bookId
      chapterId
      verseStart
      verseEnd
      color
      createdAt
      updatedAt
    }
  }
`;

export const BULK_DELETE_BIBLE_HIGHLIGHTS_MUTATION = gql`
  mutation BulkDeleteBibleHighlights($ids: [String!]!) {
    bulkDeleteBibleHighlights(ids: $ids)
  }
`;
