
import type { Product } from '../types';

const today = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export const PRODUCTS_DATA: Product[] = [
  { 
    id: '1', 
    identificazione: {
      produttore: 'Azienda Alimentare S.p.A.', 
      logo: 'https://logo.clearbit.com/mutti-parma.com',
      denominazioneScheda: 'Salsa Pronta di Pomodoro', 
      codiceProdotto: 'SPP-001', 
      dataRedazione: addMonths(today, -13).toISOString(), // <-- Alert: > 12 mesi
      numeroRevisione: 3,
    },
    descrizione: {
        denominazioneLegale: 'Salsa di pomodoro con basilico',
        ingredienti: 'Pomodoro (90%), cipolla, olio di oliva, basilico (1%), sale.',
        allergeni: '',
        contaminazioneCrociata: 'Può contenere tracce di sedano.',
        alcol: '',
        descrizioneProdotto: 'Salsa densa e saporita, pronta per condire la pasta.',
        proprietaSensoriali: 'Colore rosso vivo, profumo intenso di pomodoro e basilico.'
    },
    nutrizionale: {
        energia: '35kcal/146kJ',
        grassi: '1.5g',
        acidiGrassiSaturi: '0.2g',
        carboidrati: '4.0g',
        zuccheri: '3.8g',
        fibre: '1.1g',
        proteine: '1.2g',
        sale: '0.5g',
    },
    sicurezza: {
        listeria: 'Assente in 25g',
        salmonella: 'Assente in 25g',
        eColi: '< 10 ufc/g',
        enterobacteriaceae: '< 10 ufc/g',
        stafilococchi: '< 10 ufc/g',
        limitiContaminanti: 'Conforme',
        ph: 4.2,
        umidita: 85,
    },
    conservazione: {
        tmcScadenza: addDays(today, 250).toISOString(),
        condizioniStoccaggio: 'Luogo fresco e asciutto, lontano da fonti di calore.',
        shelfLifePostApertura: '3 giorni in frigorifero',
        modalitaUso: 'Scaldare prima dell\'uso.'
    },
    packaging: {
        tipoImballaggio: 'Vasetto in vetro',
        materiali: 'Vetro, alluminio (capsula)',
        dimensioni: '7x7x12 cm',
        pesoNetto: '0.350 kg',
        composizionePallet: '120 casse x 12 vasetti'
    },
    conformita: {
        normative: 'Reg. (CE) 852/2004',
        certificazioni: [
            { tipo: 'BIO', scadenza: addDays(today, 300).toISOString() },
            { tipo: 'IFS', scadenza: addDays(today, 45).toISOString() } // <-- Alert: < 60 giorni
        ],
        origineIngredienti: 'Pomodoro: Italia; Olio: Spagna'
    }
  },
  { 
    id: '2', 
    identificazione: {
      produttore: 'Caseificio Molisano', 
      logo: 'https://logo.clearbit.com/caseificiomolisano.it',
      denominazioneScheda: 'Mozzarella di Bufala Campana DOP', 
      codiceProdotto: 'MBC-012', 
      dataRedazione: addMonths(today, -2).toISOString(),
      numeroRevisione: 1,
    },
    descrizione: {
        denominazioneLegale: 'Formaggio fresco a pasta filata',
        ingredienti: 'Latte di bufala, siero innesto naturale, caglio, sale.',
        allergeni: 'Latte',
        alcol: '',
        descrizioneProdotto: 'Mozzarella DOP prodotta con latte di bufala fresco.',
        proprietaSensoriali: '' // <-- Alert: campo obbligatorio mancante (anche se non lo è nello schema, per test)
    },
    nutrizionale: {
        energia: '288kcal/1205kJ',
        grassi: '24g',
        acidiGrassiSaturi: '16g',
        carboidrati: '0.8g',
        zuccheri: '0.8g',
        fibre: '0g',
        proteine: '17g',
        sale: '0.7g',
    },
    sicurezza: {
        listeria: 'Assente in 25g',
        salmonella: 'Assente in 25g',
        eColi: 'Assente',
        enterobacteriaceae: '< 10 ufc/g',
        stafilococchi: '< 100 ufc/g',
        limitiContaminanti: 'Conforme ai limiti di legge',
        ph: 5.2,
        umidita: 58,
    },
    conservazione: {
        tmcScadenza: addDays(today, 15).toISOString(), // <-- Alert: < 30 giorni
        condizioniStoccaggio: 'In frigorifero a +4°C, immersa nel suo liquido di governo.',
        shelfLifePostApertura: '1 giorno',
        modalitaUso: 'Consumare a temperatura ambiente.'
    },
    packaging: {
        tipoImballaggio: 'Busta in plastica',
        materiali: 'Polietilene per alimenti',
        dimensioni: '15x20 cm',
        pesoNetto: '0.250 kg',
        pesoSgocciolato: '0.125 kg',
        composizionePallet: '100 casse x 8 buste'
    },
    conformita: {
        normative: 'Disciplinare DOP',
        certificazioni: [
            { tipo: 'DOP', scadenza: addDays(today, 700).toISOString() },
        ],
        origineIngredienti: 'Latte: Italia (area DOP)'
    }
  },
   { 
    id: '3', 
    identificazione: {
      produttore: 'Forno Antico', 
      denominazioneScheda: 'Biscotti Frollini al Cacao', 
      codiceProdotto: 'BFC-305', 
      dataRedazione: addMonths(today, -1).toISOString(),
      numeroRevisione: 1,
    },
    descrizione: {
        denominazioneLegale: 'Biscotti frollini',
        ingredienti: 'Farina di frumento, zucchero, burro, uova, cacao in polvere (8%).',
        allergeni: 'Frumento, burro, uova',
        contaminazioneCrociata: 'Può contenere tracce di frutta a guscio.',
        alcol: '',
        descrizioneProdotto: 'Frollini friabili e golosi, perfetti per la colazione.',
        proprietaSensoriali: 'Colore bruno, odore intenso di cacao e burro.'
    },
    nutrizionale: {
        energia: '480kcal/2008kJ',
        grassi: '22g',
        acidiGrassiSaturi: '12g',
        carboidrati: '63g',
        zuccheri: '25g',
        fibre: '3.5g',
        proteine: '7g',
        sale: '0.2g',
    },
    sicurezza: {
        listeria: 'Non applicabile',
        salmonella: 'Assente in 25g',
        eColi: 'Non applicabile',
        enterobacteriaceae: 'Non applicabile',
        stafilococchi: 'Non applicabile',
        limitiContaminanti: 'Conforme',
        umidita: 4,
    },
    conservazione: {
        tmcScadenza: addDays(today, 180).toISOString(),
        condizioniStoccaggio: 'Luogo fresco e asciutto.',
        shelfLifePostApertura: '7 giorni',
        modalitaUso: 'Ideali per l\'inzuppo.'
    },
    packaging: {
        tipoImballaggio: 'Sacchetto in polipropilene',
        materiali: 'PP',
        dimensioni: '20x30x5 cm',
        pesoNetto: '0.400 kg',
        composizionePallet: '50 casse x 20 sacchetti'
    },
    conformita: {
        normative: 'Reg. (UE) 1169/2011',
        certificazioni: [
           { tipo: 'BRC', scadenza: addDays(today, -10).toISOString() }, // <-- Alert: scaduta
        ],
        origineIngredienti: 'UE / non UE'
    }
  },
];