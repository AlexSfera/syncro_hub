import bitrixSyncHandler from './bitrix-sync.js';

// Revisión profunda diaria. Usa el mismo motor y las mismas garantías de
// autenticación/auditoría; solo amplía el rango para detectar correcciones
// antiguas realizadas en Bitrix24.
export default function handler(req, res) {
  req.query = Object.assign({}, req.query || {}, {
    modo: 'history',
    dias: '400'
  });
  return bitrixSyncHandler(req, res);
}
