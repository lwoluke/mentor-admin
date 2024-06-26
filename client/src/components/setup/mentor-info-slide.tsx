/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import React, { useEffect, useState } from "react";
import { Checkbox, FormControlLabel, TextField, Tooltip } from "@mui/material";
import { Mentor } from "types";
import { Slide } from "./slide";
import { onTextInputChanged } from "helpers";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
export function MentorInfoSlide(props: {
  classes: Record<string, string>;
  mentor: Mentor;
  isMentorLoading: boolean;
  editMentor: (edits: Partial<Mentor>) => void;
  userName: string;
}): JSX.Element {
  const { classes, mentor, isMentorLoading, editMentor, userName } = props;
  const [defaultsSet, setDefaultsSet] = useState(false);

  useEffect(() => {
    if (defaultsSet || isMentorLoading || !mentor) {
      return;
    }
    editMentor({
      ...(!mentor.title ? { title: "Please enter your profession here" } : {}),
      ...(!mentor.name ? { name: userName } : {}),
      ...(!mentor.firstName ? { firstName: userName.split(" ")[0] } : {}),
    });
    setDefaultsSet(true);
  }, [mentor, isMentorLoading]);

  return (
    <Slide
      classes={props.classes}
      title="Tell us a little about yourself."
      content={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <TextField
            style={{
              width: "90%",
            }}
            required
            data-cy="first-name"
            label="First Name"
            variant="outlined"
            value={mentor.firstName || ""}
            onChange={(e) =>
              onTextInputChanged(e, () => {
                editMentor({ firstName: e.target.value });
              })
            }
            className={classes.inputField}
          />
          <TextField
            style={{
              width: "90%",
            }}
            required
            data-cy="name"
            label="Full Name"
            variant="outlined"
            value={mentor.name || ""}
            onChange={(e) =>
              onTextInputChanged(e, () => {
                editMentor({ name: e.target.value });
              })
            }
            className={classes.inputField}
          />
          <TextField
            style={{
              width: "90%",
            }}
            required
            data-cy="mentor-title"
            label="Job Title"
            variant="outlined"
            value={mentor.title || ""}
            onChange={(e) =>
              onTextInputChanged(e, () => {
                editMentor({ title: e.target.value });
              })
            }
            className={classes.inputField}
          />
          <TextField
            style={{
              width: "90%",
            }}
            data-cy="email"
            label="Email"
            type="email"
            variant="outlined"
            value={mentor.email || ""}
            onChange={(e) => {
              editMentor({ email: e.target.value });
            }}
            className={classes.inputField}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={mentor.allowContact}
                  onChange={() =>
                    editMentor({ allowContact: !mentor.allowContact })
                  }
                  color="secondary"
                />
              }
              label="Allow people to contact me"
              style={{
                width: "fit-content",
                alignSelf: "flex-start",
                marginLeft: 0,
                marginRight: 2,
              }}
            />
            <Tooltip
              title="Your organization will screen emails before you receive them."
              placement="top"
            >
              <HelpOutlineIcon
                style={{
                  color: "gray",
                  cursor: "pointer",
                  margin: 0,
                }}
              />
            </Tooltip>
          </div>
        </div>
      }
    />
  );
}
