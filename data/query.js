const { CATEGORY_MAP } = require("./categories");
const { ALIAS_MAPPINGS } = require("./aliases");

function normalize(text) {
  return (text || "").trim().toLowerCase().replace(/\s+/g, "");
}

function toFullName(code, name) {
  if (!code) return name || "未定义";
  return `(${code})${name}`;
}

function resolveCategory(mapping) {
  if (mapping.categoryCode) {
    const category = CATEGORY_MAP[mapping.categoryCode];
    const name = category ? category.name : (mapping.categoryName || "未定义");
    return {
      code: mapping.categoryCode,
      name,
      fullName: toFullName(mapping.categoryCode, name),
      note: mapping.note || ""
    };
  }

  const name = mapping.categoryName || "未定义";
  return {
    code: "待补充",
    name,
    fullName: name,
    note: mapping.note || ""
  };
}

function uniqueByFullName(list) {
  const seen = new Set();
  return list.filter((item) => {
    if (seen.has(item.fullName)) return false;
    seen.add(item.fullName);
    return true;
  });
}

function findMatch(assetName) {
  if (!assetName) return { status: "empty", primary: null, candidates: [] };

  const key = normalize(assetName);
  const exactMappings = ALIAS_MAPPINGS.filter((item) => normalize(item.asset) === key).map(resolveCategory);
  const exactCandidates = uniqueByFullName(exactMappings);

  if (exactCandidates.length === 1) {
    return { status: "single", primary: exactCandidates[0], candidates: exactCandidates };
  }

  if (exactCandidates.length > 1) {
    return { status: "multi", primary: exactCandidates[0], candidates: exactCandidates.slice(0, 3) };
  }

  // 单字输入不参与模糊匹配，避免“度”命中“温度计”这类误匹配
  if (key.length < 2) {
    return { status: "none", primary: null, candidates: [] };
  }

  const fuzzyMatches = ALIAS_MAPPINGS.filter(
    (item) => normalize(item.asset).includes(key) || key.includes(normalize(item.asset))
  ).map(resolveCategory);
  const fuzzyCandidates = uniqueByFullName(fuzzyMatches);

  if (fuzzyCandidates.length === 1) {
    return { status: "fuzzy", primary: fuzzyCandidates[0], candidates: fuzzyCandidates };
  }

  if (fuzzyCandidates.length > 1) {
    return { status: "multi", primary: fuzzyCandidates[0], candidates: fuzzyCandidates.slice(0, 3) };
  }

  return { status: "none", primary: null, candidates: [] };
}

module.exports = {
  normalize,
  findMatch,
  resolveCategory
};
