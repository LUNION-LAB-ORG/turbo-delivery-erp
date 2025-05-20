interface GainDetail {
  code: string;
  frais: number;
  commission: number;
  date: string; 
}

interface Gain {
  solde: number;
  gains: GainDetail[];
}

interface JourGain {
  date: string; 
  jour: string; 
  gain: Gain;
}

interface PerformanceApercuGlobalGain {
  solde: number;
  gains: JourGain[];
}
