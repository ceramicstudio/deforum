import React from "react";

export function DisplayWhen(
  props: React.PropsWithChildren<{ isTrue: boolean }>,
) {
  if (props.isTrue) {
    return props.children;
  } else {
    return <></>;
  }
}
