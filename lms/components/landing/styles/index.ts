import { bodyOverrideStyles } from "./body-override";
import { baseStyles } from "./base";
import { headerStyles } from "./header";
import { heroStyles } from "./hero";
import { featuresStyles } from "./features";
import { howItWorksStyles } from "./howitworks";
import { platformStyles } from "./platform";
import { ctaStyles } from "./cta";
import { signInStyles } from "./signin";
import { footerStyles } from "./footer";
import { animationStyles } from "./animations";

export const allLandingStyles = [
  bodyOverrideStyles,
  baseStyles,
  headerStyles,
  heroStyles,
  featuresStyles,
  howItWorksStyles,
  platformStyles,
  signInStyles,
  ctaStyles,
  footerStyles,
  animationStyles,
].join("\n");
