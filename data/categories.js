const CATEGORIES = [
  { code: "A01010000", name: "房屋" },
  { code: "A01010100", name: "办公用房" },
  { code: "A01010200", name: "业务用房" },
  { code: "A02000000", name: "设备" },
  { code: "A02010000", name: "信息化设备" },
  { code: "A02010100", name: "计算机" },
  { code: "A02010104", name: "服务器" },
  { code: "A02010105", name: "台式计算机" },
  { code: "A02010108", name: "便携式计算机" },
  { code: "A02010200", name: "网络设备" },
  { code: "A02010300", name: "信息安全设备" },
  { code: "A02020000", name: "办公设备" },
  { code: "A02020700", name: "电子白板" },
  { code: "A02021000", name: "打印机" },
  { code: "A02021004", name: "A4彩色打印机" },
  { code: "A02021301", name: "碎纸机" },
  { code: "A02061803", name: "通风机" },
  { code: "A02061804", name: "空调机" },
  { code: "A02091001", name: "普通电视设备（电视机）" },
  { code: "A02091104", name: "平板显示设备" },
  { code: "A02100702", name: "玻璃温度计" },
  { code: "A02120201", name: "温度计量标准器具" },
  { code: "A02450200", name: "演出服饰" },
  { code: "A05000000", name: "家具和用具" },
  { code: "A05010000", name: "家具" },
  { code: "A05010103", name: "轻金属床类" },
  { code: "A05010104", name: "木制床类" },
  { code: "A05010105", name: "塑料床类" },
  { code: "A05010203", name: "教学、实验用桌" },
  { code: "A05010301", name: "办公椅" },
  { code: "A05010303", name: "会议椅" },
  { code: "A05010304", name: "教学、实验椅凳" },
  { code: "A05010399", name: "其他椅凳类" },
  { code: "A05010501", name: "书柜" },
  { code: "A05010502", name: "文件柜" },
  { code: "A05040403", name: "教具" }
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, item) => {
  acc[item.code] = item;
  return acc;
}, {});

module.exports = {
  CATEGORIES,
  CATEGORY_MAP
};
