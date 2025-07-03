export interface Character {
  name: string;
  description: string;
}

export interface ComicPanelData {
  panel: number;
  description: string;
  imageUrl?: string; 
}

export type ComicScript = ComicPanelData[];

export interface ComicData {
  characters: Character[];
  script: ComicScript;
}