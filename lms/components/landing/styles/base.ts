const css = String.raw;
export const baseStyles = css`
/* OpenGrapes Design System â global entry point.
   Consumers link this one file. @import lines only. */
/* OpenGrapes â Webfonts
   Loaded from Google Fonts. These are the canonical brand faces (not substitutions):
   Spectral (display serif), Hanken Grotesk (body/UI), Spline Sans Mono (mono/labels). */
/* cyrillic-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/d5209d86-c394-4d37-a2fe-8c285ca0b1d1.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* vietnamese */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/5f9ddca9-1139-4bf8-b1ad-373b511eab80.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/608a9e3b-13af-4e2d-860c-f33e202dcecd.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/7a01ca1e-8354-497c-92b7-5811b811d25f.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/d5209d86-c394-4d37-a2fe-8c285ca0b1d1.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* vietnamese */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/5f9ddca9-1139-4bf8-b1ad-373b511eab80.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/608a9e3b-13af-4e2d-860c-f33e202dcecd.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/7a01ca1e-8354-497c-92b7-5811b811d25f.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/d5209d86-c394-4d37-a2fe-8c285ca0b1d1.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* vietnamese */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/5f9ddca9-1139-4bf8-b1ad-373b511eab80.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/608a9e3b-13af-4e2d-860c-f33e202dcecd.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/7a01ca1e-8354-497c-92b7-5811b811d25f.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/d5209d86-c394-4d37-a2fe-8c285ca0b1d1.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* vietnamese */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/5f9ddca9-1139-4bf8-b1ad-373b511eab80.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/608a9e3b-13af-4e2d-860c-f33e202dcecd.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Hanken Grotesk';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/7a01ca1e-8354-497c-92b7-5811b811d25f.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Spectral';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/f5ff679e-18ab-4a22-bdc1-168286db56cb.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Spectral';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/6dc2c540-ae00-4dc2-bff1-7720e788858a.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: 'Spectral';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/b4aa8cb0-00a2-4d2e-9a2c-469b1920b26c.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Spectral';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/02c46655-90a1-44fa-9dd6-ad93eaa848c8.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spectral';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/8bd35447-66e6-4224-b44e-5246aad63f54.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/og-landing/36eb91fe-052a-48b3-a4ef-30e9e20258fc.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/og-landing/25a9bdba-aa5f-4aca-82a1-410dc9af562c.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/og-landing/cb31ff57-bc82-4088-9ac5-00c2aaaa21f8.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/og-landing/bfac260c-55c0-4313-81f8-2d321d347349.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/og-landing/0c939a6b-ef53-4b6e-a48b-e5b9e6b17de9.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/31c0ecfd-bf73-4982-9b60-1336eb9dcb56.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/c69bb0b6-0bde-4082-94a2-a06e8d4fae94.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/17c02966-6233-44fe-8d1a-7deb2fd60e3d.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/e3958420-3adb-4655-97bb-acd8c155e4f4.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/488e5675-cb25-44a8-aa2c-a77f01d9c6c1.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/01d510c6-b90c-4de7-a0f9-d2bf7d802185.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/91f0b5e8-76fa-4cf1-8c1f-7fe146492795.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/ccee35a3-058e-4cec-974e-bf825e153be9.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/6a0081c9-7124-40af-9f3d-d2af37169a35.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/3675f4cd-2ba4-4983-ace2-3a123d957170.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/c8ad4475-60cf-4b12-9bac-451f515bf9e5.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/52ee011c-91a6-44c5-a45c-44adc18f5403.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* vietnamese */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/42a24580-c438-4518-9db5-b1835379d90f.woff2") format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/9a30f806-5c31-4934-a6d6-07d485c9c037.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spectral';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/9567f757-def3-426f-a2c4-8d987aadabb1.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Spline Sans Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/5f4f7fe8-a2f5-42fb-be0f-b82b71651fba.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spline Sans Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/og-landing/0acf7612-ce90-478f-b924-bb97ca0bc158.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Spline Sans Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/5f4f7fe8-a2f5-42fb-be0f-b82b71651fba.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Spline Sans Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/og-landing/0acf7612-ce90-478f-b924-bb97ca0bc158.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}


/* OpenGrapes â Color tokens
   Mature, smooth palette: warm cream base, sage green + muted purple accents. */
:root {
  /* ââ Base / surfaces (warm off-white & cream) ââ */
  --cream-50:  #FBF9F3;   /* lightest paper */
  --cream-100: #F7F3E9;   /* page background */
  --cream-200: #F1ECDE;   /* sunken / alt section */
  --cream-300: #E8E1CF;   /* hairline on cream */

  /* ââ Ink (warm near-black, never pure #000) ââ */
  --ink-900: #23211C;     /* headings */
  --ink-700: #423F37;     /* body */
  --ink-500: #6B6557;     /* muted / captions */
  --ink-300: #9C9685;     /* faint */

  /* ââ Sage green (primary accent) ââ */
  --sage-50:  #EDF2EA;
  --sage-100: #DCE6D6;
  --sage-200: #BFD2B5;
  --sage-300: #9DBA8F;
  --sage-500: #6E9461;    /* core green */
  --sage-600: #587A4D;
  --sage-700: #44603C;

  /* ââ Muted purple (secondary accent) ââ */
  --plum-50:  #F0ECF4;
  --plum-100: #E3DBEC;
  --plum-200: #CBBCDC;
  --plum-300: #AD98C6;
  --plum-500: #836BA6;    /* core purple */
  --plum-600: #6B5489;
  --plum-700: #534168;

  /* ââ Semantic aliases ââ */
  --bg-page:        var(--cream-100);
  --bg-paper:       var(--cream-50);
  --bg-sunken:      var(--cream-200);
  --surface-card:   var(--cream-50);
  --border-hair:    var(--cream-300);
  --border-strong:  #DAD2BE;

  --text-heading:   var(--ink-900);
  --text-body:      var(--ink-700);
  --text-muted:     var(--ink-500);
  --text-faint:     var(--ink-300);

  --accent-green:   var(--plum-500);
  --accent-green-deep: var(--plum-700);
  --accent-purple:  var(--plum-500);
  --accent-purple-deep: var(--plum-700);

  --focus-ring:     var(--plum-300);

  /* ââ Status ââ */
  --status-paid:    var(--sage-600);
  --status-partial: #C18A3D;
  --status-unpaid:  #B6604E;
  --status-live:    #C0524A;
}

/* OpenGrapes â Typography tokens
   Display: Spectral (serif, editorial, mature). Body/UI: Hanken Grotesk. Mono: Spline Sans Mono. */
:root {
  --font-display: "Spectral", Georgia, "Times New Roman", serif;
  --font-body: "Hanken Grotesk", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "Spline Sans Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Type scale (1.25 major-third-ish, tuned) */
  --text-xs:   0.78rem;   /* 12.5px */
  --text-sm:   0.875rem;  /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-md:   1.125rem;  /* 18px */
  --text-lg:   1.375rem;  /* 22px */
  --text-xl:   1.75rem;   /* 28px */
  --text-2xl:  2.25rem;   /* 36px */
  --text-3xl:  3rem;      /* 48px */
  --text-4xl:  4rem;      /* 64px */
  --text-5xl:  5.25rem;   /* 84px */

  --leading-tight: 1.08;
  --leading-snug: 1.25;
  --leading-normal: 1.55;
  --leading-relaxed: 1.7;

  --tracking-tight: -0.02em;
  --tracking-snug: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.08em;
  --tracking-caps: 0.14em;

  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
}

/* OpenGrapes â Spacing, radius, shadow tokens */
:root {
  /* Spacing scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;
  --space-11: 160px;

  /* Radii â soft, mature, never pill-everything */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Shadows â low, warm, diffuse. No harsh black. */
  --shadow-xs: 0 1px 2px rgba(60, 52, 32, 0.05);
  --shadow-sm: 0 2px 8px rgba(60, 52, 32, 0.06);
  --shadow-md: 0 8px 24px rgba(60, 52, 32, 0.08);
  --shadow-lg: 0 18px 48px rgba(60, 52, 32, 0.10);

  /* Layout */
  --container: 1180px;
  --container-narrow: 760px;

  /* Motion */
  --ease-out: cubic-bezier(0.22, 0.61, 0.36, 1); /* @kind other */
  --ease-soft: cubic-bezier(0.4, 0, 0.2, 1); /* @kind other */
  --dur-fast: 160ms; /* @kind other */
  --dur-base: 280ms; /* @kind other */
  --dur-slow: 600ms; /* @kind other */
}

/* OpenGrapes â Base reset & element defaults */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-body);
  background: var(--bg-page);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
h1, h2, h3, h4, h5 {
  font-family: var(--font-display);
  color: var(--text-heading);
  font-weight: var(--weight-regular);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  margin: 0;
}
p { margin: 0; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
::selection { background: var(--plum-100); color: var(--ink-900); }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-purple);
  font-weight: var(--weight-medium);
}


/* cyrillic-ext */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/f3496593-b7fc-457b-9b65-7fb17a55a050.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/d48ee435-41a6-4558-bef6-ae1c8c5ab008.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/b2cf8e62-b473-40ff-b4b0-619eeda1a089.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/og-landing/925d5ff1-efb0-47c7-bbe2-80b459c062aa.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic-ext */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/f3496593-b7fc-457b-9b65-7fb17a55a050.woff2") format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/d48ee435-41a6-4558-bef6-ae1c8c5ab008.woff2") format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/b2cf8e62-b473-40ff-b4b0-619eeda1a089.woff2") format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/og-landing/925d5ff1-efb0-47c7-bbe2-80b459c062aa.woff2") format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`;
