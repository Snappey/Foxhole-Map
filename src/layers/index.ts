import LayerGroup from 'ol/layer/Group';
import {Shard} from '../services/war-api.service';

export * from './hex-overlay.service';
export * from './region-labels.service';
export * from './structure-icons.service';
export * from './region-sectors.service'

export interface LayerService {
  getLayer(shard: Shard): Promise<LayerGroup>;
  name: string;
}
