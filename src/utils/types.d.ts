interface Vector2 {
  [key: string]: number | Vector2;
  x: number;
  y: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}
