/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import React from "react";
import { TextField, Typography } from "@mui/material";
import { Mentor } from "types";
import { Slide } from "./slide";
import { onTextInputChanged } from "helpers";

export function MentorGoalSlide(props: {
  classes: Record<string, string>;
  mentor: Mentor;
  editMentor: (edits: Partial<Mentor>) => void;
}): JSX.Element {
  const { classes, mentor, editMentor } = props;

  return (
    <Slide
      classes={props.classes}
      title="My Goal"
      content={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography
            variant="h4"
            style={{
              width: "80%",
              textAlign: "center",
              alignSelf: "center",
            }}
          >
            Think how you would describe yourself to a mentee, what do you
            really want someone to take away from talking to your mentor?
          </Typography>
          <TextField
            required
            data-cy="goal-input"
            variant="outlined"
            placeholder="Enter your goal here..."
            multiline
            minRows={6}
            value={mentor.goal || ""}
            onChange={(e) =>
              onTextInputChanged(e, () => {
                editMentor({ goal: e.target.value });
              })
            }
            className={classes.inputField}
            style={{ marginTop: 20, width: "90%" }}
          />
        </div>
      }
    />
  );
}
