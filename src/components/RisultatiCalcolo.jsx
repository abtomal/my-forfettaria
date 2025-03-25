import React, { useState } from 'react';
import { COSTANTI } from '../utils/calcolatori';
import { calcolaAccontiEImposte } from '../utils/calcolo-saldo-imposte';

// Componente CalendarDate responsivo e ottimizzato
const CalendarDate = ({ month, day, label }) => {
  return (
    <div className="flex flex-col items-center mx-auto">
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

const RisultatiCalcolo = ({ 
  results, 
  tipologiaInps, 
  annoApertura, 
  dataApertura, 
  fatturatoPrecedente, 
  fatturato, 
  coefficienteRedditività, 
  limiteFatturato,
  isUnder35,
  hasCassaPrivata 
}) => {
  const [mostraDettagli, setMostraDettagli] = useState(false);
  
  if (!results) return null;

  // Calcolo degli acconti per l'anno successivo
  const calcolaAccontiAnnoSuccessivo = () => {
    const annoCorrente = new Date().getFullYear();
    // Se la partita IVA è stata appena aperta, non bisogna pagare acconti per l'anno successivo
    if (parseInt(annoApertura) === annoCorrente) {
      return {
        deveCalcolareAcconti: false,
        importoTotale: 0,
        messaggio: "Non sono previsti acconti per l'anno successivo perché la partita IVA è stata aperta nell'anno corrente."
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

  // Calcola situazione degli acconti versati e saldo/rimborso
  const infoAccontiVersati = calcolaAccontiEImposte(
    fatturatoPrecedente, 
    fatturato, 
    coefficienteRedditività, 
    annoApertura,
    isUnder35,       // Aggiunto per under 35
    hasCassaPrivata  // Aggiunto per casse private
  );

  // Calcola acconti per l'anno successivo
  const infoAcconti = calcolaAccontiAnnoSuccessivo();
  
  // Calcolo del totale che include anche gli acconti per l'anno successivo
  // e tiene conto del saldo da pagare o del rimborso
  let totaleCostiConAcconti = 0;
  
  if (infoAccontiVersati.haAccontiVersati) {
    // Se ci sono acconti versati, consideriamo il saldo (se positivo) o non consideriamo il rimborso (lo terrà comunque a parte)
    totaleCostiConAcconti = parseFloat(results.contributiInps) + Math.max(infoAccontiVersati.saldoDaPagare, 0) + infoAcconti.importoTotale;
  } else {
    // Se non ci sono acconti versati, consideriamo l'imposta completa
    totaleCostiConAcconti = parseFloat(results.totaleCosti) + infoAcconti.importoTotale;
  }
  
  // Ricalcola il netto con gli acconti inclusi
  let nettoStimatoConAcconti = parseFloat(fatturato) - totaleCostiConAcconti;
  
  // Se c'è un rimborso, lo aggiungiamo al netto
  if (infoAccontiVersati.rimborso > 0) {
    nettoStimatoConAcconti += infoAccontiVersati.rimborso;
  }

  // Stato acconti già versati (saldo o credito)
  const getStatoAccontiMessaggio = () => {
    if (!infoAccontiVersati.haAccontiVersati) {
      return "Nessun acconto versato per l'anno in corso.";
    } else if (infoAccontiVersati.saldoDaPagare > 0) {
      return <>Dovrai pagare un saldo di <span className="font-bold">€ {infoAccontiVersati.saldoDaPagare.toFixed(2)}</span> con la prossima dichiarazione.</>;
    } else if (infoAccontiVersati.rimborso > 0) {
      return <>Hai diritto a un rimborso di <span className="font-bold">€ {infoAccontiVersati.rimborso.toFixed(2)}</span> con la prossima dichiarazione.</>;
    } else {
      return "Gli acconti versati coprono esattamente l'imposta dovuta.";
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-2 text-center">Risultati del calcolo</h3>
        <p className="text-sm text-center text-blue-100 mb-4">Dati aggiornati al {new Date().getFullYear()}</p>
        
        {/* Aggiungi info sul limite se è diverso da 85.000€ */}
        {limiteFatturato !== 85000 && (
          <p className="text-sm text-center text-blue-100">
            Limite fatturato calcolato in base alla data di apertura: {limiteFatturato.toLocaleString()}€
          </p>
        )}
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
              <h4 className="text-md font-semibold text-yellow-800">Cassa previdenziale specifica rilevata</h4>
              <p className="text-sm mt-2 text-yellow-700">
                La tua professione prevede l'iscrizione a <strong>{results.nomeCassa}</strong> invece che all'INPS.
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
                Questa riduzione si applica sia sui contributi fissi che su quelli variabili.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Sezione principale con i risultati più importanti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Quanto devi tenere da parte */}
        <div className="p-5 bg-red-50 rounded-lg shadow-md border border-red-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 bg-red-500 opacity-10"></div>
          <h4 className="text-lg font-semibold text-red-800 mb-2">Quanto devi tenere da parte</h4>
          <p className="text-3xl font-bold text-red-800 mb-2">€ {totaleCostiConAcconti.toFixed(2)}</p>
          <div className="flex items-center text-sm text-red-700">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Include tasse, contributi e acconti</span>
          </div>
        </div>
        
        {/* Card Quanto puoi spendere */}
        <div className="p-5 bg-green-50 rounded-lg shadow-md border border-green-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 bg-green-500 opacity-10"></div>
          <h4 className="text-lg font-semibold text-green-800 mb-2">Quanto puoi spendere</h4>
          <p className="text-3xl font-bold text-green-800 mb-2">€ {nettoStimatoConAcconti.toFixed(2)}</p>
          <div className="flex items-center text-sm text-green-700">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ciò che rimane dopo tasse e contributi</span>
          </div>
        </div>
      </div>
      
      {/* Sezione acconti per l'anno successivo con visualizzazione calendario */}
      {infoAcconti.deveCalcolareAcconti && (
        <div className="p-4 sm:p-5 bg-amber-50 rounded-lg shadow-md border border-amber-200">
          <h4 className="text-base sm:text-lg font-semibold text-amber-800 mb-3 sm:mb-4 flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Scadenze acconti anno successivo
          </h4>
          
          {/* Container con centratura */}
          <div className="flex justify-center">
            {/* Wrapper con scorrimento orizzontale per mobile */}
            <div className="overflow-x-auto pb-2 w-full">
              <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 min-w-max sm:min-w-0">
                {infoAcconti.unicaRata ? (
                  <div className="flex justify-center w-full sm:justify-start">
                    <CalendarDate 
                      month="Nov" 
                      day="30" 
                      label={`Rata unica: €${infoAcconti.importoUnicaRata.toFixed(2)}`} 
                    />
                  </div>
                ) : (
                  <div className="flex justify-center w-full sm:justify-start gap-4 sm:gap-6">
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
          
          <div className="mt-3 p-2 sm:p-3 bg-amber-100 rounded-lg text-xs sm:text-sm text-amber-800">
            <p>
              {infoAcconti.unicaRata 
                ? `L'acconto di €${infoAcconti.importoTotale.toFixed(2)} va versato in un'unica soluzione entro il 30 novembre.` 
                : `L'acconto totale di €${infoAcconti.importoTotale.toFixed(2)} va versato in due rate: €${infoAcconti.importoPrimaRata.toFixed(2)} entro il 30 giugno e €${infoAcconti.importoSecondaRata.toFixed(2)} entro il 30 novembre.`}
            </p>
          </div>
        </div>
      )}
      
      {/* Resto del codice rimane invariato */}
      {/* ... */}

      {/* Pulsante per mostrare/nascondere i dettagli */}
      <div className="text-center mt-6">
        <button 
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-full shadow transition-colors flex items-center mx-auto"
          onClick={() => setMostraDettagli(!mostraDettagli)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mostraDettagli ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            )}
          </svg>
          {mostraDettagli ? "Nascondi dettagli" : "Mostra dettagli"}
        </button>
      </div>
      
      {/* Sezione dettagli */}
      {mostraDettagli && (
        <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Dettaglio calcoli
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Reddito Imponibile</p>
              <p className="text-lg font-semibold">€ {results.redditoImponibile}</p>
              <p className="text-xs text-gray-500 mt-1">
                {parseFloat(fatturato).toLocaleString()}€ × {coefficienteRedditività}%
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Contributi INPS</p>
              <p className="text-lg font-semibold">€ {results.contributiInps}</p>
              <p className="text-xs text-gray-500 mt-1">
                {results.isUnder35 && !results.hasCassaPrivata ? 'Riduzione under 35 applicata (-35%)' : ''}
                {results.hasCassaPrivata ? 'Nessun contributo INPS (cassa privata)' : 
                  tipologiaInps === 'artigiano' ? 'Calcolo artigiani' : `${parseFloat(results.redditoImponibile).toLocaleString()}€ × 26,07%`}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Imponibile Netto</p>
              <p className="text-lg font-semibold">€ {results.imponibileNetto}</p>
              <p className="text-xs text-gray-500 mt-1">
                Reddito Imponibile - Contributi INPS
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Imposta Sostitutiva ({results.aliquotaApplicata}%)</p>
              <p className="text-lg font-semibold">€ {results.impostaSostitutiva}</p>
              <p className="text-xs text-gray-500 mt-1">
                Imponibile Netto × {results.aliquotaApplicata}%
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Totale Tasse e Contributi</p>
              <p className="text-lg font-semibold">€ {results.totaleCosti}</p>
              <p className="text-xs text-gray-500 mt-1">
                Imposta Sostitutiva + Contributi INPS
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Tassazione Effettiva</p>
              <p className="text-lg font-semibold">{results.tassazioneEffettiva}%</p>
              <p className="text-xs text-gray-500 mt-1">
                (Totale costi ÷ Fatturato) × 100
              </p>
            </div>
          </div>
          
          {/* Informazione sul limite di fatturato calcolato */}
          {limiteFatturato !== 85000 && (
            <div className="p-4 bg-white rounded-lg shadow mb-6">
              <p className="text-sm text-gray-600">Limite di Fatturato Calcolato</p>
              <p className="text-lg font-semibold">€ {limiteFatturato.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Calcolato in base alla data di apertura ({new Date(dataApertura).toLocaleDateString()})
              </p>
            </div>
          )}
          
          {/* Dettaglio acconti già versati */}
          {infoAccontiVersati.haAccontiVersati && (
            <div className="mb-6">
              <h5 className="text-md font-semibold mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dettaglio acconti già versati
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600">Acconti già versati</p>
                  <p className="text-lg font-semibold">€ {infoAccontiVersati.importoAccontiVersati.toFixed(2)}</p>
                </div>
                {infoAccontiVersati.saldoDaPagare > 0 && (
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-600">Saldo da pagare</p>
                    <p className="text-lg font-semibold">€ {infoAccontiVersati.saldoDaPagare.toFixed(2)}</p>
                  </div>
                )}
                {infoAccontiVersati.rimborso > 0 && (
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-600">Credito d'imposta (rimborso)</p>
                    <p className="text-lg font-semibold">€ {infoAccontiVersati.rimborso.toFixed(2)}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-3 p-3 bg-white rounded-lg shadow">
                <p className="text-sm">{infoAccontiVersati.messaggioAcconti}</p>
                <p className="text-sm mt-2">{infoAccontiVersati.messaggioSaldo}</p>
              </div>
            </div>
          )}
          
          {/* Dettaglio acconti anno successivo */}
          {infoAcconti.deveCalcolareAcconti && (
            <div className="mb-6">
              <h5 className="text-md font-semibold mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dettaglio acconti anno successivo
              </h5>
              
              {infoAcconti.unicaRata ? (
                <div className="p-4 bg-white rounded-lg shadow">
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
                  <div className="p-4 bg-white rounded-lg shadow">
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
                  <div className="p-4 bg-white rounded-lg shadow">
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
              <h5 className="text-md font-semibold mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Dettaglio Contributi Artigiani
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg shadow">
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
                  <div className="p-4 bg-white rounded-lg shadow">
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
              
              <h5 className="text-md font-semibold mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Scadenze Contributi Fissi
              </h5>
              
              {/* Contenitore con scorrimento orizzontale per mobile */}
              <div className="overflow-x-auto pb-2">
                <div className="flex justify-center md:justify-start gap-4 md:gap-6 min-w-max">
                  <div className="p-3 bg-white rounded shadow flex flex-col items-center">
                    <CalendarDate 
                      month="Mag" 
                      day="16" 
                      label="1° Trimestre" 
                    />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      € {results.isUnder35 
                         ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                         : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded shadow flex flex-col items-center">
                    <CalendarDate 
                      month="Ago" 
                      day="22" 
                      label="2° Trimestre" 
                    />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      € {results.isUnder35 
                         ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                         : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded shadow flex flex-col items-center">
                    <CalendarDate 
                      month="Nov" 
                      day="16" 
                      label="3° Trimestre" 
                    />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      € {results.isUnder35 
                         ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                         : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded shadow flex flex-col items-center">
                    <CalendarDate 
                      month="Feb" 
                      day="16" 
                      label="4° Trimestre" 
                    />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      € {results.isUnder35 
                         ? (COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO * (1 - COSTANTI.RIDUZIONE_UNDER_35)).toFixed(2) 
                         : COSTANTI.QUOTA_FISSA_TRIMESTRALE_ARTIGIANO.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RisultatiCalcolo;