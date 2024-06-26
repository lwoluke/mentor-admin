/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu
The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchQuestionsById, updateQuestion } from "api";
import { getValueIfKeyExists } from "helpers";
import { LoadingError, LoadingStatus } from "hooks/graphql/loading-reducer";
import { RootState } from "store/store";
import { Question, UtteranceName } from "types";
import { MentorConfig } from "types-gql";

/** Store */

type QuestionsRecord = Record<string, QuestionState>;

export interface QuestionsState {
  questions: QuestionsRecord;
  batchLoadStatus: LoadingStatus;
  batchLoadError?: LoadingError;
}

export interface QuestionState {
  question?: Question;
  customQuestionText?: string;
  status: LoadingStatus;
  error?: LoadingError;
}

const initialState: QuestionsState = {
  questions: {},
  batchLoadStatus: LoadingStatus.NONE,
};

interface CancellabeResult<T> {
  result?: T;
  isCancelled?: boolean;
}

/** Actions */

interface LoadQuestionsByIdRes<T> extends CancellabeResult<T> {
  mentorConfig?: MentorConfig;
}

export const loadQuestionsById = createAsyncThunk(
  "questions/loadQuestionsById",
  async (
    args: { ids: string[]; reload?: boolean; mentorConfig?: MentorConfig },
    thunkAPI
  ): Promise<LoadQuestionsByIdRes<Question[]>> => {
    const state = thunkAPI.getState() as RootState;
    const ids = args.reload
      ? args.ids.filter((id) => id)
      : args.ids.filter((id) => {
          const q = getValueIfKeyExists(id, state.questions.questions);
          return (
            id &&
            (!q ||
              q.status === LoadingStatus.FAILED ||
              q.status === LoadingStatus.NONE)
          );
        });
    if (ids.length === 0) {
      return { isCancelled: true };
    }
    thunkAPI.dispatch(questionsSlice.actions.loadingQuestionsInProgress(ids));
    const questions = await fetchQuestionsById(ids);
    return {
      result: questions,
      mentorConfig: args.mentorConfig,
    };
  }
);

export const saveQuestion = createAsyncThunk(
  "questions/saveQuestion",
  async (editedData: Question, thunkAPI): Promise<Question> => {
    thunkAPI.dispatch(questionsSlice.actions.savingInProgress(editedData._id));
    const state = thunkAPI.getState() as RootState;
    if (!state.login.accessToken) {
      return Promise.reject("no access token");
    }
    return await updateQuestion(editedData, state.login.accessToken);
  }
);

function applyQuestionConfigData(
  mentorConfig: MentorConfig,
  data: QuestionsRecord
): QuestionsRecord {
  if (
    !mentorConfig?.introRecordingText &&
    !mentorConfig?.idleRecordingDuration
  ) {
    return data;
  }
  const dataCopy: QuestionsRecord = JSON.parse(JSON.stringify(data));
  for (const [k, v] of Object.entries(dataCopy)) {
    const isintroQuestion = v.question?.name === UtteranceName.INTRO;
    const isIdleQuestion = v.question?.name === UtteranceName.IDLE;
    const customQuestionText = mentorConfig.introRecordingText;
    if (isintroQuestion && customQuestionText) {
      dataCopy[k].customQuestionText = customQuestionText;
    }
    if (
      isIdleQuestion &&
      mentorConfig.idleRecordingDuration &&
      dataCopy[k].question
    ) {
      dataCopy[k].question!.minVideoLength = mentorConfig.idleRecordingDuration;
    }
  }
  return dataCopy;
}

/** Reducer */
export const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    loadingQuestionInProgress: (state, action: PayloadAction<string>) => {
      state.questions[action.payload] = {
        ...state.questions[action.payload],
        status: LoadingStatus.LOADING,
        error: undefined,
      };
    },
    loadingQuestionsInProgress: (state, action: PayloadAction<string[]>) => {
      const stateCopy = { ...state, questions: { ...state.questions } };
      for (const id of action.payload) {
        stateCopy.questions[id] = {
          ...stateCopy.questions[id],
          status: LoadingStatus.LOADING,
          error: undefined,
        };
      }
      return stateCopy;
    },
    savingInProgress: (state, action: PayloadAction<string>) => {
      state.questions[action.payload] = {
        ...state.questions[action.payload],
        status: LoadingStatus.SAVING,
        error: undefined,
      };
    },
    clearError: (state, action: PayloadAction<string>) => {
      state.questions[action.payload] = {
        ...state.questions[action.payload],
        error: undefined,
      };
    },
    clearErrors: (state) => {
      for (const k of Object.keys(state.questions)) {
        state.questions[k] = {
          ...state.questions[k],
          error: undefined,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadQuestionsById.fulfilled, (state, action) => {
        if (action.payload.isCancelled || !action.payload.result) {
          return;
        }
        const stateCopy = { ...state, questions: { ...state.questions } };
        for (const q of action.payload.result) {
          stateCopy.questions[q._id] = {
            question: q,
            status: LoadingStatus.SUCCEEDED,
            error: undefined,
          };
        }
        stateCopy["batchLoadStatus"] = LoadingStatus.SUCCEEDED;
        if (action.payload.mentorConfig) {
          stateCopy.questions = applyQuestionConfigData(
            action.payload.mentorConfig,
            stateCopy.questions
          );
        }
        return stateCopy;
      })
      .addCase(loadQuestionsById.rejected, (state, action) => {
        for (const id of action.meta.arg.ids) {
          state.batchLoadStatus = LoadingStatus.FAILED;
          state.questions[id] = {
            ...state.questions[id],
            status: LoadingStatus.FAILED,
            error: {
              message: `failed to load question`,
              error: loadQuestionsById.rejected.name,
            },
          };
        }
      })
      // saveQuestion
      .addCase(saveQuestion.fulfilled, (state, action) => {
        const q = action.payload;
        if (action.meta.arg._id !== q._id) {
          delete state.questions[action.meta.arg._id];
        }
        state.questions[q._id] = {
          question: q,
          status: LoadingStatus.SUCCEEDED,
          error: undefined,
        };
      })
      .addCase(saveQuestion.rejected, (state, action) => {
        state.questions[action.meta.arg._id] = {
          ...state.questions[action.meta.arg._id],
          status: LoadingStatus.FAILED,
          error: {
            message: `failed to save question`,
            error: saveQuestion.rejected.name,
          },
        };
      });
  },
});

export const { clearError, clearErrors } = questionsSlice.actions;

export default questionsSlice.reducer;
