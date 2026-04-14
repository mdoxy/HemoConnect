export interface Hospital {
  id: string;
  name: string;
  address: string;
  pincode: string;
  phone: string;
  latitude: number;
  longitude: number;
  type: string;
}

export const parseCSV = (csvText: string): Hospital[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map((line, index) => {
    // Better CSV parsing that handles quoted fields
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });

    return {
      id: `H${String(index + 1).padStart(3, '0')}`,
      name: obj.name || '',
      address: obj.address || '',
      pincode: obj.pincode || '',
      phone: obj.phone || '',
      latitude: parseFloat(obj.latitude) || 0,
      longitude: parseFloat(obj.longitude) || 0,
      type: obj.type || 'Private',
    };
  }).filter(h => h.name); // Filter out empty rows
};

