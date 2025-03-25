import React, { useState, useEffect } from 'react';
import { atecoData } from '../data/atecoData';
import { COSTANTI, verificaCassaPrivata } from '../utils/calcolatori.js';

const CalcoloForm = ({ formData, setFormData, onSubmit, errors, limiteFatturato }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAteco, setFilteredAteco] = useState([]);

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

  const mostraFatturatoPrecedente = () => {
    const annoCorrente = new Date().getFullYear();
    return parseInt(formData.annoApertura) < annoCorrente;
  };

  const getTipologiaLabel = () => {
    if (!formData.codiceAteco) return "Seleziona un codice ATECO";
    
    const selectedAteco = atecoData.find(a => a.codice === formData.codiceAteco);
    if (!selectedAteco) return "Tipologia non determinata";
    
    return selectedAteco.tipo === 'artigiano' ? "Artigiano" : "Commerciante";
  };

  const handleDataAperturaChange = (e) => {
    const data = new Date(e.target.value);
    setFormData({
      ...formData, 
      dataApertura: e.target.value,
      annoApertura: data.getFullYear() // Aggiorna automaticamente l'anno
    });
  };

  // Verifica cassa privata quando cambia il codice ATECO
  useEffect(() => {
    if (formData.codiceAteco) {
      const risultatoCassa = verificaCassaPrivata(formData.codiceAteco);
      
      if (risultatoCassa.hasCassaPrivata) {
        setFormData({
          ...formData,
          hasCassaPrivata: true,
          cassaPrivata: risultatoCassa.cassaPrivata,
          nomeCassa: risultatoCassa.nomeCassa
        });
      } else {
        // Reimposta solo se prima c'era una cassa privata
        if (formData.hasCassaPrivata) {
          setFormData({
            ...formData,
            hasCassaPrivata: false,
            cassaPrivata: '',
            nomeCassa: ''
          });
        }
      }
    }
  }, [formData.codiceAteco]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">Calcolatore Partita IVA Forfettaria</h1>
      
      {/* Card informativa */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
        <p className="text-sm text-blue-800">
          Inserisci i dati della tua attività per calcolare tasse e contributi nel regime forfettario.
          I risultati includono imposta sostitutiva, contributi INPS e previsioni per l'anno successivo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Fatturato Annuo (€)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">€</span>
                <input
                  type="number"
                  value={formData.fatturato}
                  onChange={(e) => setFormData({...formData, fatturato: e.target.value})}
                  className="w-full p-2 pl-8 pr-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={limiteFatturato}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Limite: {limiteFatturato.toLocaleString()}€</p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Data di apertura
                </label>
                <div className="relative">
                  {!formData.dataApertura && (
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  )}
                  <input
                    type="date"
                    value={formData.dataApertura}
                    onChange={handleDataAperturaChange}
                    className={`w-full p-2 ${!formData.dataApertura ? 'pl-8' : 'pl-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'anno di apertura ({formData.annoApertura}) viene estratto automaticamente
                </p>
              </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Codice ATECO
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cerca per codice, descrizione o categoria..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="w-full p-2 pl-8 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.codiceAteco && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFormData({
                      ...formData,
                      codiceAteco: '',
                      coefficienteRedditività: 0,
                      tipologiaInps: 'commerciante',
                      hasCassaPrivata: false,
                      cassaPrivata: '',
                      nomeCassa: ''
                    });
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isOpen && searchTerm && filteredAteco.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {filteredAteco.map((ateco) => (
                  <button
                    key={ateco.codice}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        codiceAteco: ateco.codice,
                        coefficienteRedditività: ateco.coefficiente,
                        tipologiaInps: ateco.tipo || 'commerciante'
                      });
                      setSearchTerm(ateco.codice);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 flex flex-col border-b transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {ateco.codice}
                      </span>
                      <span className="text-sm text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                        {ateco.coefficiente}%
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 mt-1">
                      {ateco.descrizione}
                    </span>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {ateco.categoria}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {ateco.tipo === 'artigiano' ? 'Artigiano' : 'Commerciante'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isOpen && searchTerm && filteredAteco.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nessun codice ATECO trovato
              </div>
            )}
          </div>

          {formData.codiceAteco && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Tipologia contribuente</p>
                  <p className="font-medium">{getTipologiaLabel()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Coefficiente di redditività</p>
                  <p className="font-medium text-blue-600">{formData.coefficienteRedditività}%</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Avviso cassa privata */}
          {formData.hasCassaPrivata && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-medium">Cassa previdenziale rilevata</h4>
              </div>
              <p className="mt-2 text-sm">
                In base al codice ATECO selezionato, dovresti essere iscritto a <strong>{formData.nomeCassa}</strong> invece che all'INPS.
                I calcoli non includeranno i contributi INPS ma considera che dovrai versare i contributi alla cassa di categoria.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          {mostraFatturatoPrecedente() && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Fatturato Anno Precedente (€)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">€</span>
                <input
                  type="number"
                  value={formData.fatturatoPrecedente}
                  onChange={(e) => setFormData({...formData, fatturatoPrecedente: e.target.value})}
                  className="w-full p-2 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={COSTANTI.LIMITE_FATTURATO}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Necessario per calcolare gli acconti già versati</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Reddito da lavoro dipendente (€)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">€</span>
              <input
                type="number"
                value={formData.redditoDiLavoro}
                onChange={(e) => setFormData({...formData, redditoDiLavoro: e.target.value})}
                className="w-full p-2 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Limite: {COSTANTI.LIMITE_REDDITO_LAVORO.toLocaleString()}€</p>
          </div>

          <div className="mt-4 space-y-3">
            {/* Aggiunto per under 35 */}
            <div className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                id="isUnder35"
                checked={formData.isUnder35}
                onChange={(e) => setFormData({...formData, isUnder35: e.target.checked})}
                className="w-4 h-4 text-blue-600 mr-3 focus:ring-blue-500"
              />
              <label htmlFor="isUnder35" className="cursor-pointer flex-grow">
                Hai meno di 35 anni? (Riduzione contributi INPS del 35%)
              </label>
            </div>

            <div className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                id="pensionato"
                checked={formData.pensionato}
                onChange={(e) => setFormData({...formData, pensionato: e.target.checked})}
                className="w-4 h-4 text-blue-600 mr-3 focus:ring-blue-500"
              />
              <label htmlFor="pensionato" className="cursor-pointer flex-grow">Sei pensionato?</label>
            </div>

            <div className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                id="altrePartiteIva"
                checked={formData.altrePartiteIva}
                onChange={(e) => setFormData({...formData, altrePartiteIva: e.target.checked})}
                className="w-4 h-4 text-blue-600 mr-3 focus:ring-blue-500"
              />
              <label htmlFor="altrePartiteIva" className="cursor-pointer flex-grow">Hai partecipazioni in società?</label>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 animate-pulse">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-semibold">Errori riscontrati:</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calcola
        </button>
      </form>
    </div>
  );
};

export default CalcoloForm;