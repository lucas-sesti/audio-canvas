export class Square {
    constructor(
      public x: number,
      public y: number,
      public w: number,
      public h: number,
      public color: string,
      public velocityX: number = Math.random() - 0.5,
      public velocityY: number = Math.random() - 0.5,
    ) { }
  
    public render(ctx: CanvasRenderingContext2D): void {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  
  }