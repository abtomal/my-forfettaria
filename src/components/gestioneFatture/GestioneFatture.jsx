// src/components/GestioneFatture.jsx 
import React, { useState, useEffect } from 'react';
import { atecoData } from '../../data/atecoData'; 
import { verificaCassaPrivata } from '../../utils/calcolatori'; 
import ScadenzeFatture from './ScadenzeFatture';
import ProiezioniContabilita from '../ProiezioniContabilita';
import HeaderGestioneFatture from './HeaderGestioneFatture';
import InfoCodeAteco from './InfoCodeAteco';
import FormNuovaFattura from './FormNuovaFattura';
import RiepilogoTotali from './RiepilogoTotali';
import FattureRegistrate from './FattureRegistrate';
import ImpostazioniModal from './ImpostazioniModal';


const GestioneFatture = () => {
  const [formData, setFormData] = useState({
    fatturato: '',
    codiceAteco: '',
    coefficienteRedditività: 0,
    descrizione: '',
    dataEmissione: new Date().toISOString().split('T')[0],
    dataScadenza: '',
    pagata: false,
    hasCassaPrivata: false, // Aggiunto per casse private
    cassaPrivata: '',      // Aggiunto per casse private
    nomeCassa: ''         // Aggiunto per casse private
  });

  const [fattureSalvate, setFattureSalvate] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAteco, setFilteredAteco] = useState([]);
  const [mostraProiezioni, setMostraProiezioni] = useState(false);
  const [mostraImpostazioni, setMostraImpostazioni] = useState(true);
  const [mostraFormNuovaFattura, setMostraFormNuovaFattura] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' o 'desc'
  
  // Per la ricerca ATECO nel modale impostazioni
  const [searchTermImpostazioni, setSearchTermImpostazioni] = useState('');
  const [isOpenImpostazioni, setIsOpenImpostazioni] = useState(false);
  const [filteredAtecoImpostazioni, setFilteredAtecoImpostazioni] = useState([]);
  
  // Dati utente separati dal form normale
  const [datiUtente, setDatiUtente] = useState({
    codiceAteco: '',
    coefficienteRedditività: 0,
    annoApertura: new Date().getFullYear() - 1, // Default anno precedente
    dataApertura: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0], // Default 1 gennaio anno precedente
    tipologiaInps: 'commerciante',
    isUnder35: false,          // Aggiunto per under 35
    hasCassaPrivata: false,    // Aggiunto per casse private
    cassaPrivata: '',          // Aggiunto per casse private
    nomeCassa: ''             // Aggiunto per casse private
  });

  // Funzione per calcolare il limite di fatturato in base alla data di apertura
  const calcolaLimiteFatturato = () => {
    const annoCorrente = new Date().getFullYear();
    const annoApertura = parseInt(datiUtente.annoApertura);
    
    // Se l'anno di apertura è precedente all'anno corrente, il limite è 85.000€
    if (annoApertura < annoCorrente) {
      return 85000;
    }
    
    // Se l'anno di apertura è l'anno corrente, calcoliamo il limite proporzionale
    if (annoApertura === annoCorrente) {
      let dataApertura;
      
      // Verificare se abbiamo una data di apertura valida
      if (datiUtente.dataApertura && datiUtente.dataApertura.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataApertura = new Date(datiUtente.dataApertura);
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
  }

  // Calcoliamo il limite di fatturato
  const limiteFatturato = calcolaLimiteFatturato();

  // Carica le fatture salvate al caricamento del componente
  useEffect(() => {
    const savedInvoices = localStorage.getItem('fatture');
    if (savedInvoices) {
      setFattureSalvate(JSON.parse(savedInvoices));
    }
    
    // Carica i dati dell'utente dal localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setDatiUtente(parsedData);
        
        // Precompila il form con il codice ATECO memorizzato
        if (parsedData.codiceAteco) {
          setFormData(prevFormData => ({
            ...prevFormData,
            codiceAteco: parsedData.codiceAteco,
            coefficienteRedditività: parsedData.coefficienteRedditività || 0,
            hasCassaPrivata: parsedData.hasCassaPrivata || false,
            cassaPrivata: parsedData.cassaPrivata || '',
            nomeCassa: parsedData.nomeCassa || ''
          }));
          setSearchTerm(parsedData.codiceAteco);
          setSearchTermImpostazioni(parsedData.codiceAteco);
        }
        
        // Se l'anno di apertura è già impostato, nascondi il modale
        if (parsedData.annoApertura && parsedData.annoApertura < new Date().getFullYear()) {
          setMostraImpostazioni(false);
        }
      } catch (e) {
        console.error("Errore nel parsing dei dati utente:", e);
      }
    }
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredAteco([]);
      return;
    }

    const searchTerms = term.toLowerCase().split(' ').filter(t => t.length > 0);
    
    const filtered = atecoData.filter(ateco => {
      const searchString = `${ateco.codice} ${ateco.descrizione} ${ateco.categoria}`.toLowerCase();
      return searchTerms.every(t => searchString.includes(t));
    }).sort((a, b) => {
      const aStartsWithCode = a.codice.toLowerCase().startsWith(term.toLowerCase());
      const bStartsWithCode = b.codice.toLowerCase().startsWith(term.toLowerCase());
      if (aStartsWithCode && !bStartsWithCode) return -1;
      if (!aStartsWithCode && bStartsWithCode) return 1;
      return 0;
    }).slice(0, 10);

    setFilteredAteco(filtered);
    setIsOpen(true);
  };

  const handleSearchImpostazioni = (term) => {
    setSearchTermImpostazioni(term);
    if (!term) {
      setFilteredAtecoImpostazioni([]);
      return;
    }

    const searchTerms = term.toLowerCase().split(' ').filter(t => t.length > 0);
    
    const filtered = atecoData.filter(ateco => {
      const searchString = `${ateco.codice} ${ateco.descrizione} ${ateco.categoria}`.toLowerCase();
      return searchTerms.every(t => searchString.includes(t));
    }).sort((a, b) => {
      const aStartsWithCode = a.codice.toLowerCase().startsWith(term.toLowerCase());
      const bStartsWithCode = b.codice.toLowerCase().startsWith(term.toLowerCase());
      if (aStartsWithCode && !bStartsWithCode) return -1;
      if (!aStartsWithCode && bStartsWithCode) return 1;
      return 0;
    }).slice(0, 10);

    setFilteredAtecoImpostazioni(filtered);
    setIsOpenImpostazioni(true);
  };

  const salvaFattura = (e) => {
    e.preventDefault();
    
    // Se non c'è un codice ATECO nel form ma c'è nei dati utente, usalo
    let nuovaFattura = { ...formData };
    if (!nuovaFattura.codiceAteco && datiUtente.codiceAteco) {
      nuovaFattura.codiceAteco = datiUtente.codiceAteco;
      nuovaFattura.coefficienteRedditività = datiUtente.coefficienteRedditività;
      nuovaFattura.hasCassaPrivata = datiUtente.hasCassaPrivata;
      nuovaFattura.cassaPrivata = datiUtente.cassaPrivata;
      nuovaFattura.nomeCassa = datiUtente.nomeCassa;
    }
    
    // Aggiungi l'ID e la data di registrazione
    nuovaFattura = {
      ...nuovaFattura,
      id: Date.now(),
      dataRegistrazione: new Date().toISOString()
    };

    const nuoveFatture = [...fattureSalvate, nuovaFattura];
    setFattureSalvate(nuoveFatture);
    localStorage.setItem('fatture', JSON.stringify(nuoveFatture));

    // Se c'è un codice ATECO nel form, aggiorna i dati utente
    if (formData.codiceAteco) {
      const nuoviDatiUtente = {
        ...datiUtente,
        codiceAteco: formData.codiceAteco,
        coefficienteRedditività: formData.coefficienteRedditività,
        hasCassaPrivata: formData.hasCassaPrivata,
        cassaPrivata: formData.cassaPrivata,
        nomeCassa: formData.nomeCassa
      };
      setDatiUtente(nuoviDatiUtente);
      localStorage.setItem('userData', JSON.stringify(nuoviDatiUtente));
    }

    setFormData({
      fatturato: '',
      codiceAteco: formData.codiceAteco, // Mantiene il codice ATECO
      coefficienteRedditività: formData.coefficienteRedditività, // Mantiene il coefficiente
      hasCassaPrivata: formData.hasCassaPrivata, // Mantiene le info sulla cassa privata
      cassaPrivata: formData.cassaPrivata,
      nomeCassa: formData.nomeCassa,
      descrizione: '',
      dataEmissione: new Date().toISOString().split('T')[0],
      dataScadenza: '',
      pagata: false
    });
    
    // Nascondi il form dopo il salvataggio
    setMostraFormNuovaFattura(false);
  };

  const togglePagamento = (id) => {
    const nuoveFatture = fattureSalvate.map(fattura => 
      fattura.id === id 
        ? {...fattura, pagata: !fattura.pagata}
        : fattura
    );
    setFattureSalvate(nuoveFatture);
    localStorage.setItem('fatture', JSON.stringify(nuoveFatture));
  };

  const rimuoviFattura = (id) => {
    const nuoveFatture = fattureSalvate.filter(f => f.id !== id);
    setFattureSalvate(nuoveFatture);
    localStorage.setItem('fatture', JSON.stringify(nuoveFatture));
  };

  const salvaDatiUtente = (e) => {
    e.preventDefault();
    
    // Verifica e salva i dati utente
    const nuoviDatiUtente = {
      ...datiUtente,
      annoApertura: parseInt(datiUtente.annoApertura),
      codiceAteco: datiUtente.codiceAteco || formData.codiceAteco,
      coefficienteRedditività: datiUtente.coefficienteRedditività || formData.coefficienteRedditività,
      hasCassaPrivata: datiUtente.hasCassaPrivata || formData.hasCassaPrivata,
      cassaPrivata: datiUtente.cassaPrivata || formData.cassaPrivata,
      nomeCassa: datiUtente.nomeCassa || formData.nomeCassa
    };
    
    // Se c'è un codice ATECO, aggiorna anche il form principale
    if (nuoviDatiUtente.codiceAteco && !formData.codiceAteco) {
      setFormData(prevFormData => ({
        ...prevFormData,
        codiceAteco: nuoviDatiUtente.codiceAteco,
        coefficienteRedditività: nuoviDatiUtente.coefficienteRedditività,
        hasCassaPrivata: nuoviDatiUtente.hasCassaPrivata,
        cassaPrivata: nuoviDatiUtente.cassaPrivata,
        nomeCassa: nuoviDatiUtente.nomeCassa
      }));
      setSearchTerm(nuoviDatiUtente.codiceAteco);
    }
    
    setDatiUtente(nuoviDatiUtente);
    localStorage.setItem('userData', JSON.stringify(nuoviDatiUtente));
    setMostraImpostazioni(false);
  };

  // Quando si seleziona un codice ATECO nel form principale
  const selezionaAteco = (ateco) => {
    // Verificare se c'è una cassa privata per questo ATECO
    const risultatoCassa = verificaCassaPrivata(ateco.codice);
    
    // Aggiorna il form corrente
    setFormData({
      ...formData,
      codiceAteco: ateco.codice,
      coefficienteRedditività: ateco.coefficiente,
      hasCassaPrivata: risultatoCassa.hasCassaPrivata,
      cassaPrivata: risultatoCassa.cassaPrivata || '',
      nomeCassa: risultatoCassa.nomeCassa || ''
    });
    
    // Aggiorna anche i dati utente
    const nuoviDatiUtente = {
      ...datiUtente,
      codiceAteco: ateco.codice,
      coefficienteRedditività: ateco.coefficiente,
      tipologiaInps: ateco.tipo || 'commerciante',
      hasCassaPrivata: risultatoCassa.hasCassaPrivata,
      cassaPrivata: risultatoCassa.cassaPrivata || '',
      nomeCassa: risultatoCassa.nomeCassa || ''
    };
    
    setDatiUtente(nuoviDatiUtente);
    localStorage.setItem('userData', JSON.stringify(nuoviDatiUtente));
    
    setSearchTerm(ateco.codice);
    setIsOpen(false);
  };

  // Quando si seleziona un codice ATECO nelle impostazioni
  const selezionaAtecoImpostazioni = (ateco) => {
    // Verificare se c'è una cassa privata per questo ATECO
    const risultatoCassa = verificaCassaPrivata(ateco.codice);
    
    // Aggiorna i dati utente
    const nuoviDatiUtente = {
      ...datiUtente,
      codiceAteco: ateco.codice,
      coefficienteRedditività: ateco.coefficiente,
      tipologiaInps: ateco.tipo || 'commerciante',
      hasCassaPrivata: risultatoCassa.hasCassaPrivata,
      cassaPrivata: risultatoCassa.cassaPrivata || '',
      nomeCassa: risultatoCassa.nomeCassa || ''
    };
    
    setDatiUtente(nuoviDatiUtente);
    localStorage.setItem('userData', JSON.stringify(nuoviDatiUtente));
    
    // Aggiorna anche il form principale
    setFormData({
      ...formData,
      codiceAteco: ateco.codice,
      coefficienteRedditività: ateco.coefficiente,
      hasCassaPrivata: risultatoCassa.hasCassaPrivata,
      cassaPrivata: risultatoCassa.cassaPrivata || '',
      nomeCassa: risultatoCassa.nomeCassa || ''
    });
    setSearchTerm(ateco.codice);
    
    setSearchTermImpostazioni(ateco.codice);
    setIsOpenImpostazioni(false);
  };

  const calcolaTotali = () => {
    const totali = {
      totale: 0,
      numeroFatture: fattureSalvate.length,
      daPagare: 0,
      pagate: 0
    };

    fattureSalvate.forEach(fattura => {
      const importo = parseFloat(fattura.fatturato);
      totali.totale += importo;
      if (fattura.pagata) {
        totali.pagate += importo;
      } else {
        totali.daPagare += importo;
      }
    });

    return totali;
  };

  const totali = calcolaTotali();

  // Ottieni il nome del codice ATECO
  const getAtecoName = (codice) => {
    const ateco = atecoData.find(a => a.codice === codice);
    return ateco ? `${ateco.codice} - ${ateco.descrizione}` : codice;
  };

  // Toggle l'ordine di visualizzazione
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Header con titolo e pulsanti */}
        <HeaderGestioneFatture 
          setMostraFormNuovaFattura={setMostraFormNuovaFattura}
          mostraFormNuovaFattura={mostraFormNuovaFattura}
          setMostraImpostazioni={setMostraImpostazioni}
          setMostraProiezioni={setMostraProiezioni}
        />

        {/* Informazioni sul codice ATECO */}
        {datiUtente.codiceAteco && (
          <InfoCodeAteco 
            datiUtente={datiUtente}
            getAtecoName={getAtecoName}
          />
        )}

        <ScadenzeFatture fatture={fattureSalvate} />

        {/* Form per nuova fattura */}
        {mostraFormNuovaFattura && (
          <FormNuovaFattura 
            mostraFormNuovaFattura={mostraFormNuovaFattura}
            formData={formData}
            setFormData={setFormData}
            datiUtente={datiUtente}
            handleSearch={handleSearch}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isOpen={isOpen}
            filteredAteco={filteredAteco}
            selezionaAteco={selezionaAteco}
            salvaFattura={salvaFattura}
          />
        )}

        {fattureSalvate.length > 0 && (
          <>
            {/* Riepilogo totali con barra di progresso */}
            <RiepilogoTotali 
              totali={totali}
              limiteFatturato={limiteFatturato}
            />

            {/* Fatture registrate */}
            <FattureRegistrate 
              sortOrder={sortOrder}
              toggleSortOrder={toggleSortOrder}
              fattureSalvate={fattureSalvate}
              onTogglePagamento={togglePagamento}
              onRimuoviFattura={rimuoviFattura}
            />
          </>
        )}
        
        {/* Modale Impostazioni */}
        {mostraImpostazioni && (
          <ImpostazioniModal 
            datiUtente={datiUtente}
            setDatiUtente={setDatiUtente}
            searchTermImpostazioni={searchTermImpostazioni}
            setSearchTermImpostazioni={setSearchTermImpostazioni}
            handleSearchImpostazioni={handleSearchImpostazioni}
            isOpenImpostazioni={isOpenImpostazioni}
            filteredAtecoImpostazioni={filteredAtecoImpostazioni}
            selezionaAtecoImpostazioni={selezionaAtecoImpostazioni}
            getAtecoName={getAtecoName}
            setMostraImpostazioni={setMostraImpostazioni}
            salvaDatiUtente={salvaDatiUtente}
            formData={formData}
            setFormData={setFormData}
            setSearchTerm={setSearchTerm}
          />
        )}
        
        {/* Modal Proiezioni Contabilità */}
        {mostraProiezioni && (
          <ProiezioniContabilita 
            fatture={fattureSalvate}
            codiceAteco={datiUtente.codiceAteco}
            coefficienteRedditività={datiUtente.coefficienteRedditività}
            annoApertura={datiUtente.annoApertura}
            dataApertura={datiUtente.dataApertura}
            tipologiaInps={datiUtente.tipologiaInps}
            isUnder35={datiUtente.isUnder35}  // Aggiunto per under 35
            hasCassaPrivata={datiUtente.hasCassaPrivata}  // Aggiunto per casse private
            onClose={() => setMostraProiezioni(false)}
          />
        )}
      </div>
    </div>
  );
};

export default GestioneFatture;