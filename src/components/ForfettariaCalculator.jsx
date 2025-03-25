import React, { useState } from 'react';
import CalcoloForm from './Form';
import RisultatiCalcolo from './RisultatiCalcolo';
import { calcolaContributiInps, verificaRequisiti } from '../utils/calcolatori';

const ForfettariaCalculator = () => {
  const [formData, setFormData] = useState({
    fatturato: '',
    fatturatoPrecedente: '',
    codiceAteco: '',
    annoApertura: new Date().getFullYear(),
    dataApertura: new Date().toISOString().split('T')[0],
    pensionato: false,
    altrePartiteIva: false,
    redditoDiLavoro: 0,
    coefficienteRedditività: 0,
    tipologiaInps: 'commerciante',
    isUnder35: false,          // Aggiunto per under 35
    hasCassaPrivata: false,    // Aggiunto per casse private
    cassaPrivata: '',          // Aggiunto per casse private
    nomeCassa: ''             // Aggiunto per casse private
  });

  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState(null);

  // Funzione per calcolare il limite di fatturato in base alla data di apertura
  const calcolaLimiteFatturato = () => {
    const annoCorrente = new Date().getFullYear();
    const annoApertura = parseInt(formData.annoApertura);
    
    // Se l'anno di apertura è precedente all'anno corrente, il limite è 85.000€
    if (annoApertura < annoCorrente) {
      return 85000;
    }
    
    // Se l'anno di apertura è l'anno corrente, calcoliamo il limite proporzionale
    if (annoApertura === annoCorrente) {
      let dataApertura;
      
      // Verificare se abbiamo una data di apertura valida
      if (formData.dataApertura && formData.dataApertura.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataApertura = new Date(formData.dataApertura);
      } else {
        // Se non abbiamo una data valida, assumiamo l'inizio dell'anno corrente
        dataApertura = new Date(annoCorrente, 0, 1);
      }
      
      const inizioAnno = new Date(annoCorrente, 0, 1); // 1 gennaio dell'anno corrente
      const fineAnno = new Date(annoCorrente, 11, 31); // 31 dicembre dell'anno corrente
      
      // Calcoliamo i giorni totali dell'anno
      const giorniTotaliAnno = Math.ceil((fineAnno - inizioAnno) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcoliamo i giorni che mancano alla fine dell'anno dalla data di apertura
      const giorniRimanenti = Math.ceil((fineAnno - dataApertura) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcoliamo il limite proporzionale
      // fatturato max = € 85.000 – (€ 85.000 x (365 – giorni che mancano alla fine dell'anno)/365)
      const limiteCalcolato = 85000 - (85000 * (giorniTotaliAnno - giorniRimanenti) / giorniTotaliAnno);
      
      // Arrotondiamo a numero intero
      return Math.round(limiteCalcolato);
    }
    
    // Se per qualche motivo l'anno di apertura è nel futuro, restituiamo il limite standard
    return 85000;
  };

  // Calcoliamo il limite di fatturato
  const limiteFatturato = calcolaLimiteFatturato();

  const calculateTaxes = (e) => {
    e.preventDefault();
    
    // Verifica che il fatturato non superi il limite calcolato
    if (parseFloat(formData.fatturato) > limiteFatturato) {
      setErrors([`Il fatturato supera il limite di ${limiteFatturato.toLocaleString()}€ per la tua situazione`]);
      setResults(null);
      return;
    }
    
    const errors = verificaRequisiti(formData);
    setErrors(errors);
    
    if (errors.length > 0) {
      setResults(null);
      return;
    }

    const fatturato = parseFloat(formData.fatturato);
    const coefficiente = formData.coefficienteRedditività / 100;
    
    // Calcolo del reddito imponibile lordo
    const redditoImponibile = fatturato * coefficiente;
    
    // Calcolo dei contributi INPS - aggiunti i parametri per under 35 e cassa privata
    const contributiInps = calcolaContributiInps(
      redditoImponibile, 
      formData.tipologiaInps, 
      formData.pensionato,
      formData.isUnder35,
      formData.hasCassaPrivata
    );
    
    // Calcolo dell'imponibile netto (sottraendo i contributi INPS)
    const imponibileNetto = redditoImponibile - contributiInps;
    
    // Determina se si applica l'aliquota agevolata per i primi 5 anni
    const isFirst5Years = new Date().getFullYear() - parseInt(formData.annoApertura) < 5;
    const aliquotaImposta = isFirst5Years ? 0.05 : 0.15;
    
    // Calcolo dell'imposta sostitutiva sull'imponibile netto
    const impostaSostitutiva = imponibileNetto * aliquotaImposta;
    
    // Calcolo del totale costi
    const totaleCosti = impostaSostitutiva + contributiInps;
    
    // Calcolo del netto stimato
    const nettoStimato = fatturato - totaleCosti;
    
    // Calcolo della tassazione effettiva
    const tassazioneEffettiva = ((totaleCosti / fatturato) * 100).toFixed(1);
    
    setResults({
      redditoImponibile: redditoImponibile.toFixed(2),
      contributiInps: contributiInps.toFixed(2),
      imponibileNetto: imponibileNetto.toFixed(2),
      impostaSostitutiva: impostaSostitutiva.toFixed(2),
      totaleCosti: totaleCosti.toFixed(2),
      nettoStimato: nettoStimato.toFixed(2),
      aliquotaApplicata: (aliquotaImposta * 100),
      tassazioneEffettiva,
      isUnder35: formData.isUnder35,
      hasCassaPrivata: formData.hasCassaPrivata,
      nomeCassa: formData.nomeCassa
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CalcoloForm 
          formData={formData}
          setFormData={setFormData}
          onSubmit={calculateTaxes}
          errors={errors}
          limiteFatturato={limiteFatturato}
        />

        <RisultatiCalcolo 
          results={results}
          tipologiaInps={formData.tipologiaInps}
          annoApertura={formData.annoApertura}
          dataApertura={formData.dataApertura}
          fatturatoPrecedente={formData.fatturatoPrecedente}
          fatturato={formData.fatturato}
          coefficienteRedditività={formData.coefficienteRedditività}
          limiteFatturato={limiteFatturato}
          isUnder35={formData.isUnder35}
          hasCassaPrivata={formData.hasCassaPrivata}
        />
      </div>
    </div>
  );
};

export default ForfettariaCalculator;