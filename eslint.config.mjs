import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [globalIgnores([".next/**", ".next-local/**"]), ...nextVitals];

export default eslintConfig;
