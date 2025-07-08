import { Injectable } from '@angular/core';
import {HexName} from './war-api.service';


export const hexCoords: Record<HexName, [number, number]> = {
  "DeadLandsHex": [0, 0],
  "CallahansPassageHex": [0, 1],
  "MarbanHollow": [1, 0],
  "DrownedValeHex": [1, -1],
  "UmbralWildwoodHex": [0, -1],
  "LochMorHex": [-1, -1],
  "LinnMercyHex": [-1, 0],
  "KingsCageHex": [-2, 0],
  "SableportHex": [-2, -1],
  "HeartlandsHex": [-1, -2],
  "WestgateHex": [-3, -1],
  "OriginHex": [-3, -2],
  "AshFieldsHex": [-2, -2],
  "RedRiverHex": [-1, -3],
  "GreatMarchHex": [0, -2],
  "KalokaiHex": [0, -3],
  "AcrithiaHex": [1, -3],
  "ShackledChasmHex": [1, -2],
  "TerminusHex": [2, -2],
  "AllodsBightHex": [2, -1],
  "ReaversPassHex": [3, -2],
  "TheFingersHex": [4, -1],
  "EndlessShoreHex": [3, -1],
  "ClahstraHex": [2, 0],
  "StlicanShelfHex": [3, 0],
  "TempestIslandHex": [4, 0],
  "MorgensCrossingHex": [3, 1],
  "WeatheredExpanseHex": [2, 1],
  "ViperPitHex": [1, 1],
  "ClansheadValleyHex": [2, 2],
  "HowlCountyHex": [1, 2],
  "BasinSionnachHex": [0, 3],
  "ReachingTrailHex": [0, 2],
  "SpeakingWoodsHex": [-1, 2],
  "MooringCountyHex": [-1, 1],
  "GodcroftsHex": [4, 1],
  "CallumsCapeHex": [-2, 2],
  "StonecradleHex": [-2, 1],
  "NevishLineHex": [-3, 1],
  "FarranacCoastHex": [-3, 0],
  "OarbreakerHex": [-4, 1],
  "FishermansRowHex": [-4, 0],
  "StemaLandingHex": [-4, -1],
};


@Injectable({
  providedIn: 'root'
})
export class HexCoordinateService {

  constructor() { }

  public readonly hexSize = 4680;
  public readonly hexWidth = this.hexSize * 2;
  public readonly hexWidthQtr = this.hexWidth / 4;
  public readonly hexWidthHalf = this.hexWidth / 2;
  public readonly hexHeight = this.hexSize * Math.sqrt(3);
  public readonly hexHeightHalf = this.hexHeight / 2;

  public readonly centerX = 32770;
  public readonly centerY = 32770;

  private calculateOffset(x: number): number {
    const isZeroCol = x === 0;
    if (isZeroCol) {
      return 0;
    }

    return x > 0
      ? -this.hexWidthQtr * (Math.abs(x))
      : this.hexWidthQtr * (Math.abs(x));
  }

  public getCoordinates(hex: HexName): [number, number] {
    const [x, y] = hexCoords[hex];
    const isEvenQ = x % 2 === 0;

    return [
      this.centerX + (x * this.hexWidth) + (this.calculateOffset(x)),
      this.centerY + (y * this.hexHeight) + (isEvenQ ? 0 : this.hexHeight/2)
    ];
  }


  public normaliseCoordinates(hexName: HexName, percentageCoords: number[]): [number, number] {
    const [sX, sY] = this.getCoordinates(hexName);
    const topLeft = [sX - this.hexWidthHalf, sY + this.hexHeightHalf];
    const topRight = [sX + this.hexWidthHalf, sY - this.hexHeightHalf];
    const bottomLeft = [sX - this.hexWidthHalf, sY - this.hexHeightHalf];

    const xRange = Math.abs(topLeft[0] - topRight[0]);
    const yRange = Math.abs(topLeft[1] - bottomLeft[1]);

    return [
      topLeft[0] + (percentageCoords[0] * xRange),
      topLeft[1] - (percentageCoords[1] * yRange)
    ]
  }

}
