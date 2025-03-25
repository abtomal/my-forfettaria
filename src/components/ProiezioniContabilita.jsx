// src/components/ProiezioniContabilita.jsx
import React, { useState, useEffect } from 'react';
import { COSTANTI } from '../utils/calcolatori';

// Componente CalendarDate responsivo e ottimizzato con icone perfettamente centrate
const CalendarDate = ({ month, day, label }) => {
  return (
    <div className="flex flex-col items-center mx-auto"> {/* mx-auto per centrare il contenitore stesso */}
      {/* Dimensioni ridotte su mobile, normali su desktop */}
      <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-green-600 text-white text-xs font-bold py-1 text-center uppercase">
          {month}
        </div>
        <div className="flex items-center justify-center h-10 sm:h-14">
          <span className="text-2xl sm:text-3xl font-bold text-green-800">{day}</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-700 mt-1 sm:mt-2 font-medium text-center w-full">{label}</p>
    </div>
  );
};

const ProiezioniContabilita = ({ 
  fatture, 
  codiceAteco, 
  coefficienteRedditività, 
  annoApertura, 
  dataApertura, 
  tipologiaInps, 
  onClose,
  isUnder35 = false,          // Aggiunti i nuovi parametri
  hasCassaPrivata = false
}) => {
  const [mostraDettagli, setMostraDettagli] = useState(false);
  const [results, setResults] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    const annoCorrente = new Date().getFullYear();
    // Converti annoApertura in un numero intero valido
    const annoAperturaNum = parseInt(annoApertura);
    
    // Salva informazioni di debug
    setDebugInfo({
      annoAperturaOriginale: annoApertura,
      annoAperturaConvertito: annoAperturaNum,
      annoCorrente,
      isAnnoCorrente: annoAperturaNum === annoCorrente,
      isAnnoValido: !isNaN(annoAperturaNum) && annoAperturaNum > 1900 && annoAperturaNum <= annoCorrente
    });
    
    // Filtra le fatture dell'anno corrente
    const fattureAnnoCorrente = fatture.filter(fattura => {
      const dataEmissione = new Date(fattura.dataEmissione);
      return dataEmissione.getFullYear() === annoCorrente;
    });
    
    // Calcola il fatturato totale dell'anno corrente
    const fatturato = fattureAnnoCorrente.reduce((total, fattura) => 
      total + parseFloat(fattura.fatturato), 0);
    
    // Calcola il reddito imponibile
    const coefficiente = coefficienteRedditività / 100;
    const redditoImponibile = fatturato * coefficiente;
    
    // Calcola i contributi INPS
    let contributiInps = 0;
    
    // Non calcolare i contributi INPS se l'utente ha una cassa privata
    if (hasCassaPrivata) {
      contributiInps = 0;
    } else if (tipologiaInps === 'artigiano') {
      // Quota fissa annuale
      let contributoFisso = COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * 4;
      
      // Contributo aggiuntivo se il reddito supera la soglia
      let contributoAggiuntivo = 0;
      if (redditoImponibile > COSTANTI.SOGLIA_REDDITO_ARTIGIANO) {
        contributoAggiuntivo = (redditoImponibile - COSTANTI.SOGLIA_REDDITO_ARTIGIANO) * COSTANTI.ALIQUOTA_AGGIUNTIVA_ARTIGIANO;
      }
      
      // Calcolo del contributo totale
      contributiInps = contributoFisso + contributoAggiuntivo;
      
      // Applica riduzione under 35 se applicabile
      if (isUnder35) {
        contributiInps = contributiInps * (1 - COSTANTI.RIDUZIONE_UNDER_35);
      }
    } else {
      // Commerciante
      contributiInps = redditoImponibile * COSTANTI.ALIQUOTA_COMMERCIANTE;
      
      // Applica riduzione under 35 se applicabile
      if (isUnder35) {
        contributiInps = contributiInps * (1 - COSTANTI.RIDUZIONE_UNDER_35);
      }
    }
    
    // Calcola l'imponibile netto (sottraendo i contributi INPS dal reddito imponibile)
    const imponibileNetto = redditoImponibile - contributiInps;
    
    // Determina se l'azienda è nei primi 5 anni
    const isFirst5Years = annoCorrente - annoAperturaNum < 5;
    
    // Calcola l'imposta sostitutiva sul reddito netto
    const aliquotaImposta = isFirst5Years ? 0.05 : 0.15;
    const impostaSostitutiva = imponibileNetto * aliquotaImposta;
    
    // Calcola il totale dei costi
    const totaleCosti = impostaSostitutiva + contributiInps;
    
    // Calcola il netto stimato
    const nettoStimato = fatturato - totaleCosti;
    
    // Calcola la tassazione effettiva
    const tassazioneEffettiva = fatturato > 0 ? ((totaleCosti / fatturato) * 100).toFixed(1) : "0.0";
    
    // Prepara i risultati
    setResults({
      fatturato: fatturato.toFixed(2),
      redditoImponibile: redditoImponibile.toFixed(2),
      contributiInps: contributiInps.toFixed(2),
      imponibileNetto: imponibileNetto.toFixed(2),
      impostaSostitutiva: impostaSostitutiva.toFixed(2),
      totaleCosti: totaleCosti.toFixed(2),
      nettoStimato: nettoStimato.toFixed(2),
      aliquotaApplicata: (aliquotaImposta * 100),
      tassazioneEffettiva,
      isUnder35,           // Aggiunti i nuovi campi
      hasCassaPrivata
    });
  }, [fatture, codiceAteco, coefficienteRedditività, annoApertura, tipologiaInps, isUnder35, hasCassaPrivata]);
  
  if (!results) return <div className="p-6 text-center">Calcolo in corso...</div>;

  // Calcolo degli acconti per l'anno successivo
  const calcolaAccontiAnnoSuccessivo = () => {
    const annoCorrente = new Date().getFullYear();
    // Converti annoApertura in un numero intero valido
    const annoAperturaNum = parseInt(annoApertura);
    
    // Verifica se l'anno di apertura è valido e se è l'anno corrente
    const isAnnoValido = !isNaN(annoAperturaNum) && annoAperturaNum > 1900 && annoAperturaNum <= annoCorrente;
    const isAnnoCorrente = annoAperturaNum === annoCorrente;
    
    // Se l'anno non è valido o è l'anno corrente, non calcolare gli acconti
    if (!isAnnoValido || isAnnoCorrente) {
      return {
        deveCalcolareAcconti: false,
        importoTotale: 0,
        messaggio: `Non sono previsti acconti per l'anno successivo perché ${
          !isAnnoValido ? "l'anno di apertura non è valido." : "la partita IVA è stata aperta nell'anno corrente."
        }`
      };
    }

    const impostaSostitutiva = parseFloat(results.impostaSostitutiva);
    if (impostaSostitutiva <= 0) {
      return {
        deveCalcolareAcconti: false,
        importoTotale: 0,
        messaggio: "Non sono previsti acconti per l'anno successivo perché l'imposta sostitutiva è pari a 0."
      };
    }

    const soglia = 257.52;

    if (impostaSostitutiva < soglia) {
      return {
        deveCalcolareAcconti: true,
        unicaRata: true,
        importoTotale: impostaSostitutiva,
        importoUnicaRata: impostaSostitutiva,
        scadenzaUnicaRata: "30 novembre",
        messaggio: `L'acconto di ${impostaSostitutiva.toFixed(2)}€ è inferiore a 257,52€ e va versato in un'unica soluzione l'anno prossimo.`
      };
    } else {
      const primaRata = Math.floor(impostaSostitutiva * 0.5 * 100) / 100; // Arrotonda per difetto a 2 decimali
      const secondaRata = Math.floor((impostaSostitutiva - primaRata) * 100) / 100; // Arrotonda il resto
      
      return {
        deveCalcolareAcconti: true,
        unicaRata: false,
        importoTotale: impostaSostitutiva,
        importoPrimaRata: primaRata,
        importoSecondaRata: secondaRata,
        scadenzaPrimaRata: "30 giugno",
        scadenzaSecondaRata: "30 novembre",
        messaggio: `L'acconto di ${impostaSostitutiva.toFixed(2)}€ per l'anno prossimo va versato in due rate.`
      };
    }
  };
  
  // Calcola acconti per l'anno successivo
  const infoAcconti = calcolaAccontiAnnoSuccessivo();
  
  // Aggiunge gli acconti al totale dei costi
  const totaleCostiConAcconti = parseFloat(results.totaleCosti) + infoAcconti.importoTotale;
  
  // Ricalcola il netto con gli acconti inclusi
  const nettoStimatoConAcconti = parseFloat(results.nettoStimato) - infoAcconti.importoTotale;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Proiezioni Contabilità</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="text-lg font-semibold mb-2">Basato su</h3>
            <p>Fatturato dell'anno corrente: <span className="font-bold">€ {results.fatturato}</span></p>
            <p>Partita IVA aperta nell'anno: <span className="font-bold">{debugInfo.annoAperturaConvertito || "N/A"}</span></p>
            <p>Imposta sostitutiva: <span className="font-bold">€ {results.impostaSostitutiva}</span></p>
          </div>
          
          {/* Avviso cassa privata */}
          {results.hasCassaPrivata && (
            <div className="p-5 bg-yellow-50 rounded-lg shadow-md border border-yellow-200">
              <div className="flex items-start mb-3">
                <div className="bg-yellow-200 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-yellow-800">Cassa previdenziale specifica</h4>
                  <p className="text-sm mt-2 text-yellow-700">
                    I calcoli presentati <strong>non includono</strong> i contributi da versare alla cassa di categoria.
                    Consulta il sito della tua cassa previdenziale per i dettagli sui contributi da versare.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Avviso riduzione under 35 */}
          {results.isUnder35 && !results.hasCassaPrivata && (
            <div className="p-5 bg-green-50 rounded-lg shadow-md border border-green-200">
              <div className="flex items-start mb-3">
                <div className="bg-green-200 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-green-800">Riduzione under 35 applicata</h4>
                  <p className="text-sm mt-2 text-green-700">
                    È stata applicata la riduzione del 35% sui contributi INPS prevista per i soggetti con età inferiore a 35 anni.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Sezione principale con i risultati più importanti */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card grande: Quanto devi tenere da parte */}
            <div className="p-6 bg-red-100 rounded-lg shadow-md border border-red-200">
              <h4 className="text-lg font-semibold text-red-800">Quanto devi tenere da parte</h4>
              <p className="text-3xl font-bold text-red-800 my-3">€ {totaleCostiConAcconti.toFixed(2)}</p>
              <p className="text-sm text-red-700">
                Include tasse, contributi e acconti
              </p>
            </div>
            
            {/* Card grande: Quanto puoi spendere */}
            <div className="p-6 bg-blue-100 rounded-lg shadow-md border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800">Quanto puoi spendere</h4>
              <p className="text-3xl font-bold text-blue-800 my-3">€ {nettoStimatoConAcconti.toFixed(2)}</p>
              <p className="text-sm text-blue-700">
                Ciò che rimane dopo tasse e contributi
              </p>
            </div>
          </div>
          
          {/* Sezione acconti per l'anno successivo con visualizzazione calendario */}
          {infoAcconti.deveCalcolareAcconti && (
            <div className="p-5 bg-amber-50 rounded-lg shadow-md border border-amber-200">
              <h4 className="text-lg font-semibold text-amber-800 mb-4">Acconti per l'anno successivo</h4>
              
              {/* Container con centratura */}
              <div className="flex justify-center">
                {/* Wrapper con scorrimento orizzontale per mobile */}
                <div className="overflow-x-auto pb-2 w-full">
                  <div className="flex justify-center sm:justify-start gap-6 min-w-max sm:min-w-0">
                    {infoAcconti.unicaRata ? (
                      <div className="flex justify-center w-full">
                        <CalendarDate 
                          month="Nov" 
                          day="30" 
                          label={`Rata unica: €${infoAcconti.importoUnicaRata.toFixed(2)}`} 
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center w-full gap-6">
                        <CalendarDate 
                          month="Giu" 
                          day="30" 
                          label={`Prima rata: €${infoAcconti.importoPrimaRata.toFixed(2)}`} 
                        />
                        <CalendarDate 
                          month="Nov" 
                          day="30" 
                          label={`Seconda rata: €${infoAcconti.importoSecondaRata.toFixed(2)}`} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm mt-4 text-amber-800">
                {infoAcconti.messaggio}
              </p>
            </div>
          )}
          
          {/* Pulsante per mostrare/nascondere i dettagli */}
          <div className="text-center mt-6">
            <button 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded shadow"
              onClick={() => setMostraDettagli(!mostraDettagli)}
            >
              {mostraDettagli ? "Nascondi dettagli" : "Approfondisci"}
            </button>
          </div>
          
          {/* Sezione dettagli */}
          {mostraDettagli && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">Dettaglio calcoli</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Reddito Imponibile</p>
                  <p className="text-lg font-semibold">€ {results.redditoImponibile}</p>
                  <p className="text-sm text-gray-500 mt-1">Fatturato × Coefficiente redditività</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Contributi INPS</p>
                  <p className="text-lg font-semibold">€ {results.contributiInps}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {results.hasCassaPrivata ? 'Nessun contributo INPS (cassa privata)' : 
                     `${tipologiaInps === 'artigiano' ? 'Calcolo artigiani' : 'Calcolo commercianti'}${
                       results.isUnder35 ? ' con riduzione under 35' : ''
                     }`}
                  </p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Imponibile Netto</p>
                  <p className="text-lg font-semibold">€ {results.imponibileNetto}</p>
                  <p className="text-sm text-gray-500 mt-1">Reddito Imponibile - Contributi INPS</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Imposta Sostitutiva ({results.aliquotaApplicata}%)</p>
                  <p className="text-lg font-semibold">€ {results.impostaSostitutiva}</p>
                  <p className="text-sm text-gray-500 mt-1">Imponibile Netto × {results.aliquotaApplicata}%</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Totale Tasse e Contributi</p>
                  <p className="text-lg font-semibold">€ {results.totaleCosti}</p>
                  <p className="text-sm text-gray-500 mt-1">Imposta Sostitutiva + Contributi INPS</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <p className="text-sm text-gray-600">Tassazione Effettiva</p>
                  <p className="text-lg font-semibold">{results.tassazioneEffettiva}%</p>
                  <p className="text-sm text-gray-500 mt-1">(Totale costi ÷ Fatturato) × 100</p>
                </div>
              </div>
              
              {/* Dettaglio acconti anno successivo */}
              {infoAcconti.deveCalcolareAcconti && (
                <div className="mb-6">
                  <h5 className="text-md font-semibold mb-3">Dettaglio Acconti Anno Successivo</h5>
                  
                  {infoAcconti.unicaRata ? (
                    <div className="p-4 bg-white rounded shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Rata unica</p>
                          <p className="text-sm text-gray-600">Scadenza: {infoAcconti.scadenzaUnicaRata}</p>
                        </div>
                        <div className="bg-amber-50 px-3 py-1 rounded border border-amber-200">
                          <p className="text-lg font-bold">€ {infoAcconti.importoUnicaRata.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Prima rata (50%)</p>
                            <p className="text-sm text-gray-600">Scadenza: {infoAcconti.scadenzaPrimaRata}</p>
                          </div>
                          <div className="bg-amber-50 px-3 py-1 rounded border border-amber-200">
                            <p className="text-lg font-bold">€ {infoAcconti.importoPrimaRata.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Seconda rata (50%)</p>
                            <p className="text-sm text-gray-600">Scadenza: {infoAcconti.scadenzaSecondaRata}</p>
                          </div>
                          <div className="bg-amber-50 px-3 py-1 rounded border border-amber-200">
                            <p className="text-lg font-bold">€ {infoAcconti.importoSecondaRata.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Dettaglio contributi artigiani */}
              {tipologiaInps === 'artigiano' && !results.hasCassaPrivata && (
                <div>
                  <h5 className="text-md font-semibold mb-3">Dettaglio Contributi Artigiani</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-white rounded shadow">
                      <p className="text-sm text-gray-600">Quota Fissa Annuale</p>
                      <p className="text-lg font-semibold">
                        € {results.isUnder35 
                           ? ((COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * 4) * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                           : (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * 4).toFixed(2)}
                      </p>
                      {results.isUnder35 && (
                        <p className="text-xs text-green-600 mt-1">
                          Riduzione del 35% applicata
                        </p>
                      )}
                    </div>
                    {parseFloat(results.redditoImponibile) > COSTANTI.SOGLIA_REDDITO_ARTIGIANO && (
                      <div className="p-4 bg-white rounded shadow">
                        <p className="text-sm text-gray-600">Contributo Aggiuntivo</p>
                        <p className="text-lg font-semibold">
                          € {results.isUnder35 
                             ? (((parseFloat(results.redditoImponibile) - COSTANTI.SOGLIA_REDDITO_ARTIGIANO) * COSTANTI.ALIQUOTA_AGGIUNTIVA_ARTIGIANO) * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                             : ((parseFloat(results.redditoImponibile) - COSTANTI.SOGLIA_REDDITO_ARTIGIANO) * COSTANTI.ALIQUOTA_AGGIUNTIVA_ARTIGIANO).toFixed(2)}
                        </p>
                        {results.isUnder35 && (
                          <p className="text-xs text-green-600 mt-1">
                            Riduzione del 35% applicata
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <h5 className="text-md font-semibold mb-3">Scadenze Contributi Fissi</h5>
                  
                  {/* Container esterno per centrare */}
                  <div className="flex justify-center">
                    {/* Container scorrimento orizzontale con larghezza completa */}
                    <div className="overflow-x-auto pb-2 w-full">
                      {/* Flex container per i calendari */}
                      <div className="flex justify-center md:justify-start gap-4 min-w-max">
                        <div className="p-3 bg-white rounded shadow">
                          <CalendarDate 
                            month="Mag" 
                            day="16" 
                            label="1° Trimestre" 
                          />
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
                            € {results.isUnder35 
                               ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                               : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded shadow">
                          <CalendarDate 
                            month="Ago" 
                            day="22" 
                            label="2° Trimestre" 
                          />
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
                            € {results.isUnder35 
                               ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                               : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded shadow">
                          <CalendarDate 
                            month="Nov" 
                            day="16" 
                            label="3° Trimestre" 
                          />
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
                            € {results.isUnder35 
                               ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                               : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded shadow">
                          <CalendarDate 
                            month="Feb" 
                            day="16" 
                            label="4° Trimestre" 
                          />
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
                          € {results.isUnder35 
                               ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                               : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProiezioniContabilita;