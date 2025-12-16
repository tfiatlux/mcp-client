"use client";

import { ThemeProvider, StyleSheetManager } from "styled-components";
import original from "react95/dist/themes/original";
import { styleReset } from "react95";
import { createGlobalStyle } from "styled-components";
import ms_sans_serif from "react95/dist/fonts/ms_sans_serif.woff2";
import ms_sans_serif_bold from "react95/dist/fonts/ms_sans_serif_bold.woff2";

// react95에서 사용하는 커스텀 prop들 (DOM으로 전달되면 안 됨)
const REACT95_PROPS = new Set([
  // Tabs, Tab
  'isMultiRow',
  // Window, Frame
  'fixed',
  'position',
  'noPadding',
  'shadow',
  // Button
  'active',
  'fullWidth',
  'primary',
  'square',
  'variant',
  // Select
  'native',
  'menuMaxHeight',
  'formatDisplay',
  // Input, TextInput
  'multiline',
  'fullWidth',
  // Checkbox, Radio
  'checked',
  'indeterminate',
  // 공통
  'isDisabled',
  'isPressed',
  'isSelected',
  'isFieldset',
  'isInGroup',
  // List
  'inline',
  'fullWidth',
  // Toolbar
  'noPadding',
  // Anchor
  'underline',
  // Avatar
  'square',
  'noBorder',
  // ProgressBar
  'hideValue',
  // Slider
  'marks',
  // Tooltip
  'enterDelay',
  'leaveDelay',
]);

// 커스텀 prop 필터링 함수
function shouldForwardProp(prop: string): boolean {
  return !REACT95_PROPS.has(prop);
}

const GlobalStyles = createGlobalStyle`
  ${styleReset}
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif}') format('woff2');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'ms_sans_serif';
    src: url('${ms_sans_serif_bold}') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  body, input, select, textarea {
    font-family: 'ms_sans_serif';
  }
  
  /* Override shadcn/ui or global CSS conflicts if any */
  body {
    background-color: teal;
  }
`;

export function Win95Provider({ children }: { children: React.ReactNode }) {
  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <GlobalStyles />
      <ThemeProvider theme={original}>
        {children}
      </ThemeProvider>
    </StyleSheetManager>
  );
}

