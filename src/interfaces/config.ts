import UrlNormalizer from "./UrlNormalizer";

interface Config {
  regex: RegExp;
  searchUrl: string;
  rootUrl: string;
  urlNormalizer: UrlNormalizer;
  accessProperty: string;
  higherLevelLabel: string;
  cacheKey: string;
}

export default Config;
