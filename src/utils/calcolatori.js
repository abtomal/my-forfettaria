export const COSTANTI = {
  QUOTA_FISSA_TRIMESTRALE_ARTIGIANO: 1106.76,
  SOGLIA_REDDITO_ARTIGIANO: 18415,
  ALIQUOTA_AGGIUNTIVA_ARTIGIANO: 0.24,
  ALIQUOTA_COMMERCIANTE: 0.2607,
  LIMITE_FATTURATO: 85000,
  LIMITE_FATTURATO_IMMEDIATO: 100000,
  LIMITE_REDDITO_LAVORO: 30000,
  RIDUZIONE_UNDER_35: 0.35, // Aggiunta questa costante
};

export const CASSE_PRIVATE = {
  "FORENSE": {
    nome: "Cassa Forense",
    professioni: ["Avvocati", "Procuratori legali"],
    codiciAteco: ["69.10.10", "69.10.20"]
  },
  "ENPAM": {
    nome: "Cassa ENPAM",
    professioni: ["Medici", "Odontoiatri"],
    codiciAteco: ["86.21.00", "86.22.00", "86.23.00"]
  },
  "INPGI": {
    nome: "INPGI",
    professioni: ["Giornalisti"],
    codiciAteco: ["58.13.00", "60.10.00", "63.91.00"]
  },
  // Altre casse private possono essere aggiunte qui
};

// Funzione per verificare se un codice ATECO è associato a una cassa privata
export const verificaCassaPrivata = (codiceAteco) => {
  for (const [chiave, cassa] of Object.entries(CASSE_PRIVATE)) {
    if (cassa.codiciAteco.includes(codiceAteco)) {
      return {
        hasCassaPrivata: true,
        cassaPrivata: chiave,
        nomeCassa: cassa.nome,
        professione: cassa.professioni[0]
      };
    }
  }
  
  return {
    hasCassaPrivata: false
  };
};

export const calcolaContributiInps = (redditoImponibile, tipologiaInps, isPensionato, isUnder35 = false, hasCassaPrivata = false) => {
  // Se l'utente ha una cassa privata, non calcola i contributi INPS
  if (hasCassaPrivata) {
    return 0;
  }
  
  let contributi = 0;
  
  if (tipologiaInps === 'artigiano') {
    const quotaFissa = COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * 4;
    
    let contributoAggiuntivo = 0;
    if (redditoImponibile > COSTANTI.SOGLIA_REDDITO_ARTIGIANO) {
      const redditoEccedente = redditoImponibile - COSTANTI.SOGLIA_REDDITO_ARTIGIANO;
      contributoAggiuntivo = redditoEccedente * COSTANTI.ALIQUOTA_AGGIUNTIVA_ARTIGIANO;
    }

    contributi = quotaFissa + contributoAggiuntivo;
  } else {
    contributi = redditoImponibile * COSTANTI.ALIQUOTA_COMMERCIANTE;
  }
  
  // Applica la riduzione per under 35
  if (isUnder35) {
    contributi = contributi * (1 - COSTANTI.RIDUZIONE_UNDER_35);
  }
  
  // Applica la riduzione per pensionati
  if (isPensionato) {
    contributi = contributi / 2;
  }
  
  return contributi;
};

export const verificaRequisiti = (formData) => {
  const errors = [];
  
  // Verifica il limite di fatturato per l'anno corrente
  if (parseFloat(formData.fatturato) > COSTANTI.LIMITE_FATTURATO) {
    errors.push(`Il fatturato dell'anno corrente supera il limite di ${COSTANTI.LIMITE_FATTURATO.toLocaleString()}€. Dall'anno prossimo dovrai passare al regime ordinario.`);
  }

  // Verifica il limite di fatturato di 100.000€ (uscita immediata)
  if (parseFloat(formData.fatturato) > COSTANTI.LIMITE_FATTURATO_IMMEDIATO) {
    errors.push(`Il fatturato supera il limite di ${COSTANTI.LIMITE_FATTURATO_IMMEDIATO.toLocaleString()}€. Sei già fuori dal regime forfettario.`);
  }

  // Verifica se il fatturato dell'anno precedente supera il limite
  if (formData.fatturatoPrecedente && parseFloat(formData.fatturatoPrecedente) > COSTANTI.LIMITE_FATTURATO) {
    errors.push(`Il fatturato dell'anno precedente supera il limite di ${COSTANTI.LIMITE_FATTURATO.toLocaleString()}€. Dovresti già essere nel regime ordinario.`);
  }

  // Verifica il limite di reddito da lavoro dipendente
  if (parseFloat(formData.redditoDiLavoro) > COSTANTI.LIMITE_REDDITO_LAVORO) {
    errors.push(`Il reddito da lavoro dipendente supera ${COSTANTI.LIMITE_REDDITO_LAVORO.toLocaleString()}€. Non puoi accedere al regime forfettario.`);
  }

  // Verifica partecipazioni in società
  if (formData.altrePartiteIva) {
    errors.push("Non puoi avere partecipazioni in società e rimanere nel regime forfettario.");
  }

  return errors;
};