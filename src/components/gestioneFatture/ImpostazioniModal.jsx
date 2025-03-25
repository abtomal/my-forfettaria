// src/components/gestioneFatture/ImpostazioniModal.jsx
import React from 'react';
import { Settings, Calendar } from 'lucide-react';
import { verificaCassaPrivata } from '../../utils/calcolatori'; 

const ImpostazioniModal = ({
  datiUtente,
  setDatiUtente,
  searchTermImpostazioni,
  setSearchTermImpostazioni,
  handleSearchImpostazioni,
  isOpenImpostazioni,
  filteredAtecoImpostazioni,
  selezionaAtecoImpostazioni,
  getAtecoName,
  setMostraImpostazioni,
  salvaDatiUtente
}) => {
  const handleDataAperturaChange = (e) => {
    const data = new Date(e.target.value);
    setDatiUtente({
      ...datiUtente, 
      dataApertura: e.target.value,
      annoApertura: data.getFullYear() // Aggiorna automaticamente l'anno
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            Impostazioni Partita IVA
          </h2>
          {/* Rendi il pulsante di chiusura visibile solo se è già stata impostata una data di apertura */}
          {datiUtente.dataApertura && new Date(datiUtente.dataApertura).getFullYear() < new Date().getFullYear() && (
            <button
              onClick={() => setMostraImpostazioni(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <form onSubmit={salvaDatiUtente} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Data di apertura partita IVA
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={datiUtente.dataApertura}
                onChange={handleDataAperturaChange}
                className="w-full p-2 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              L'anno di apertura ({datiUtente.annoApertura}) viene estratto automaticamente da questa data.
            </p>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Codice ATECO principale
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
                value={searchTermImpostazioni}
                onChange={(e) => handleSearchImpostazioni(e.target.value)}
                onFocus={() => setIsOpenImpostazioni(true)}
                className="w-full p-2 pl-8 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {datiUtente.codiceAteco && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTermImpostazioni('');
                    setDatiUtente({
                      ...datiUtente,
                      codiceAteco: '',
                      coefficienteRedditività: 0,
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

            {isOpenImpostazioni && searchTermImpostazioni && filteredAtecoImpostazioni.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {filteredAtecoImpostazioni.map((ateco) => (
                  <button
                    key={ateco.codice}
                    type="button"
                    onClick={() => {
                      // Verificare se c'è una cassa privata per questo ATECO
                      const risultatoCassa = verificaCassaPrivata(ateco.codice);
                      
                      selezionaAtecoImpostazioni({
                        ...ateco,
                        hasCassaPrivata: risultatoCassa.hasCassaPrivata,
                        cassaPrivata: risultatoCassa.cassaPrivata || '',
                        nomeCassa: risultatoCassa.nomeCassa || ''
                      });
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col border-b transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {ateco.codice}
                      </span>
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {ateco.coefficiente}%
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 my-1 line-clamp-2">
                      {ateco.descrizione}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {ateco.categoria}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {ateco.tipo === 'artigiano' ? 'Artigiano' : 'Commerciante'}
                      </span>
                      {verificaCassaPrivata(ateco.codice).hasCassaPrivata && (
                        <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">
                          Cassa Privata
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isOpenImpostazioni && searchTermImpostazioni && filteredAtecoImpostazioni.length === 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
                <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nessun codice ATECO trovato
              </div>
            )}
          </div>

          {datiUtente.codiceAteco && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <p className="text-sm text-gray-600">Codice ATECO selezionato</p>
                  <p className="font-medium">{getAtecoName(datiUtente.codiceAteco)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {datiUtente.coefficienteRedditività}%
                  </span>
                  <span className="text-sm bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                    {datiUtente.tipologiaInps === 'artigiano' ? 'Artigiano' : 'Commerciante'}
                  </span>
                </div>
              </div>
              
              {/* Messaggio cassa privata */}
              {datiUtente.hasCassaPrivata && (
                <div className="mt-3 p-2 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Questa professione richiede l'iscrizione a <strong>{datiUtente.nomeCassa}</strong> invece dell'INPS.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Aggiunto: sezione per under 35 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 text-gray-700">Agevolazioni</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isUnder35"
                  checked={datiUtente.isUnder35}
                  onChange={(e) => setDatiUtente({...datiUtente, isUnder35: e.target.checked})}
                  className="w-4 h-4 text-blue-600 mr-2 focus:ring-blue-500"
                />
                <label htmlFor="isUnder35" className="text-sm">
                  Ho meno di 35 anni (riduzione contributi del 35%)
                </label>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Salva impostazioni
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImpostazioniModal;