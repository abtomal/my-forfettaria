import { calcolaContributiInps } from './calcolatori';

export const calcolaAccontiEImposte = (fatturatoPrecedente, fatturato, coefficiente, annoApertura, isUnder35 = false, hasCassaPrivata = false) => {
    const annoCorrente = new Date().getFullYear();
    
    // Verifica se l'utente ha diritto all'aliquota agevolata del 5% (primi 5 anni)
    const isFirst5Years = annoCorrente - parseInt(annoApertura) < 5;
    
    // Se la partita IVA è stata aperta quest'anno, non ci sono acconti già versati
    if (parseInt(annoApertura) >= annoCorrente) {
      return {
        haAccontiVersati: false,
        importoAccontiVersati: 0,
        impostaDovuta: 0,
        saldoDaPagare: 0,
        rimborso: 0,
        messaggioAcconti: "Non hai versato acconti per l'anno corrente perché la partita IVA è stata aperta recentemente."
      };
    }
  
    // Se non è stato specificato il fatturato precedente, non possiamo calcolare gli acconti
    if (!fatturatoPrecedente || parseFloat(fatturatoPrecedente) <= 0) {
      return {
        haAccontiVersati: false,
        importoAccontiVersati: 0,
        impostaDovuta: 0,
        saldoDaPagare: 0,
        rimborso: 0,
        messaggioAcconti: "Inserisci il fatturato dell'anno precedente per calcolare gli acconti già versati."
      };
    }
  
    // Calcola l'imposta dell'anno precedente (base per gli acconti versati)
    const redditoImponibilePrecedente = parseFloat(fatturatoPrecedente) * (coefficiente / 100);
    const contributiInpsPrecedenti = calcolaContributiInps(
      redditoImponibilePrecedente, 
      'commerciante', 
      false, 
      isUnder35, 
      hasCassaPrivata
    );
    const imponibileNettoPrecedente = redditoImponibilePrecedente - contributiInpsPrecedenti;
    const aliquotaPrecedente = isFirst5Years ? 0.05 : 0.15;
    const impostaPrecedente = imponibileNettoPrecedente * aliquotaPrecedente;
  
    // Calcola l'imposta effettiva dell'anno corrente
    const redditoImponibile = parseFloat(fatturato) * (coefficiente / 100);
    const contributiInps = calcolaContributiInps(
      redditoImponibile, 
      'commerciante', 
      false, 
      isUnder35, 
      hasCassaPrivata
    );
    const imponibileNetto = redditoImponibile - contributiInps;
    const aliquotaCorrente = isFirst5Years ? 0.05 : 0.15;
    const impostaCorrente = imponibileNetto * aliquotaCorrente;
  
    // Se l'imposta precedente era zero, non ci sono acconti versati
    if (impostaPrecedente <= 0) {
      return {
        haAccontiVersati: false,
        importoAccontiVersati: 0,
        impostaDovuta: impostaCorrente,
        saldoDaPagare: impostaCorrente,
        rimborso: 0,
        messaggioAcconti: "Non hai versato acconti per l'anno corrente perché l'imposta dell'anno precedente era zero."
      };
    }
  
    // Calcola il dettaglio degli acconti versati (100% dell'imposta precedente)
    const importoAccontiVersati = impostaPrecedente;
  
    // Calcola saldo o rimborso
    const differenza = impostaCorrente - importoAccontiVersati;
    
    let saldoDaPagare = 0;
    let rimborso = 0;
    let messaggioSaldo = "";
    
    if (differenza > 0) {
      // Se l'imposta corrente è maggiore degli acconti, c'è un saldo da pagare
      saldoDaPagare = differenza;
      messaggioSaldo = `Dovrai versare un saldo di ${saldoDaPagare.toFixed(2)}€ entro il 30 giugno di quest'anno.`;
    } else if (differenza < 0) {
      // Se l'imposta corrente è minore degli acconti, c'è un rimborso
      rimborso = Math.abs(differenza);
      messaggioSaldo = `Hai diritto a un rimborso di ${rimborso.toFixed(2)}€ che potrai ottenere in dichiarazione dei redditi.`;
    } else {
      // Se l'imposta corrente è uguale agli acconti, non c'è né saldo né rimborso
      messaggioSaldo = "Non devi versare alcun saldo né hai diritto a rimborsi, poiché gli acconti già versati coprono esattamente l'imposta dovuta.";
    }
  
    let dettaglioAcconti = {};
    const soglia = 257.52;
  
    if (impostaPrecedente < soglia) {
      dettaglioAcconti = {
        unicaRata: true,
        importoUnicaRata: impostaPrecedente,
        scadenzaUnicaRata: "30 novembre dell'anno scorso",
        messaggioAcconti: `Hai versato ${impostaPrecedente.toFixed(2)}€ di acconto in un'unica soluzione a novembre dell'anno scorso.`
      };
    } else {
      const primaRata = Math.floor(impostaPrecedente * 0.5 * 100) / 100;
      const secondaRata = Math.floor((impostaPrecedente - primaRata) * 100) / 100;
      
      dettaglioAcconti = {
        unicaRata: false,
        importoPrimaRata: primaRata,
        importoSecondaRata: secondaRata,
        scadenzaPrimaRata: "30 giugno dell'anno scorso",
        scadenzaSecondaRata: "30 novembre dell'anno scorso",
        messaggioAcconti: `Hai versato un totale di ${impostaPrecedente.toFixed(2)}€ in acconti l'anno scorso (${primaRata.toFixed(2)}€ a giugno e ${secondaRata.toFixed(2)}€ a novembre).`
      };
    }
  
    return {
      haAccontiVersati: true,
      importoAccontiVersati: importoAccontiVersati,
      impostaDovuta: impostaCorrente,
      saldoDaPagare: saldoDaPagare,
      rimborso: rimborso,
      messaggioAcconti: dettaglioAcconti.messaggioAcconti,
      messaggioSaldo: messaggioSaldo,
      ...dettaglioAcconti
    };
  };