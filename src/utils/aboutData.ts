export type Client = {
  name: string;
  website: string;
};

export type Job = {
  client: Client;
  role: string;
  year: number;
};

const notFoundClient: Client = {
  name: "Not found",
  website: "https://google.com",
};

const clients: Client[] = [
  { name: "CIC Bank", website: "https://cic.fr" },
  { name: "Wolfox", website: "https://wolfox.co" },
  { name: "Roadeo", website: "https://roadeo.co" },
  { name: "Schneider Electric", website: "https://se.com" },
  { name: "IronHack", website: "https://ironhack.com" },
  { name: "TaxFix", website: "https://taxfix.de" },
  { name: "WeCheers", website: "https://wecheers.fr" },
];

const getClient = (name: Client["name"]): Client =>
  clients.find((c) => c.name === name) || notFoundClient;

export const jobs: Job[] = [
  { client: getClient("WeCheers"), role: "App Development", year: 2022 },
  { client: getClient("WeCheers"), role: "UX/UI Design", year: 2021 },
  { client: getClient("TaxFix"), role: "UX/UI Design", year: 2021 },
  { client: getClient("IronHack"), role: "Teaching", year: 2021 },
  { client: getClient("Wolfox"), role: "UX/UI Design", year: 2021 },
  {
    client: getClient("Schneider Electric"),
    role: "Web Development",
    year: 2019,
  },
  { client: getClient("Roadeo"), role: "Mobile Development", year: 2019 },
  { client: getClient("Wolfox"), role: "Web Development", year: 2019 },
  { client: getClient("CIC Bank"), role: "Bank Teller", year: 2018 },
];

export default ["HTML", "Figma", "Blender", ""];

export enum SkillCategories {
  WebDev = "Web Development",
  Adobe = "Adobe Creative Suite",
  UXUI = "UX / UI Design",
  _3D = "3D Modeling",
  Communication = "Communication",
}

export type SkillCategory = {
  cat: SkillCategories;
  skills: string[];
};

export const allSkills: SkillCategory[] = [
  {
    cat: SkillCategories.Adobe,
    skills: [
      "Photoshop",
      "Premiere Pro",
      "Illustrator",
      "Lightroom",
      "InDesign",
    ].sort(),
  },
  {
    cat: SkillCategories.WebDev,
    skills: [
      "HTML",
      "CSS",
      "Javascript",
      "React",
      "React Native",
      "Vue",
      "Redux",
      "SQL",
      "Swift",
      "MongoDB",
      "Express",
    ].sort(),
  },
  {
    cat: SkillCategories.UXUI,
    skills: ["Figma", "Adobe XD", "Webflow", "Agile Workflow"].sort(),
  },
  {
    cat: SkillCategories._3D,
    skills: ["Blender", "Octane Renderer"],
  },
  {
    cat: SkillCategories.Communication,
    skills: ["Discord", "Slack", "Notion"],
  },
].sort((a, b) => (a.cat < b.cat ? -1 : 1));
