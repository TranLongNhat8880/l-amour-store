import { useState, useEffect } from 'react';
import axios from 'axios';

interface AddressSelectorProps {
  mode?: 'old' | 'new';
  initialProvince?: string;
  initialDistrict?: string;
  initialWard?: string;
  onChange: (province: string, district: string, ward: string) => void;
}

export function AddressSelector({ mode = 'new', initialProvince, initialDistrict, initialWard, onChange }: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [pCode, setPCode] = useState<string>('');
  const [dCode, setDCode] = useState<string>('');
  const [wCode, setWCode] = useState<string>('');

  const [pName, setPName] = useState(initialProvince || '');
  const [dName, setDName] = useState(initialDistrict || '');
  const [wName, setWName] = useState(initialWard || '');

  // 1. Fetch all provinces on mount
  useEffect(() => {
    const url = mode === 'new' 
      ? 'https://provinces.open-api.vn/api/v2/p/' 
      : 'https://provinces.open-api.vn/api/p/';
      
    axios.get(url).then(res => {
      setProvinces(res.data);
      if (initialProvince) {
        const found = res.data.find((p: any) => p.name === initialProvince || p.name.includes(initialProvince));
        if (found) setPCode(found.code.toString());
      }
    }).catch(console.error);
  }, [mode, initialProvince]);

  // 2. Fetch districts/wards when province changes
  useEffect(() => {
    if (!pCode) {
      setDistricts([]);
      setWards([]);
      return;
    }

    if (mode === 'new') {
      // In new mode, province directly has wards
      axios.get(`https://provinces.open-api.vn/api/v2/p/${pCode}?depth=2`).then(res => {
        setWards(res.data.wards || []);
        if (initialWard && res.data.wards) {
          const found = res.data.wards.find((w: any) => w.name === initialWard || w.name.includes(initialWard));
          if (found) setWCode(found.code.toString());
        }
      }).catch(console.error);
    } else {
      // In old mode, province has districts
      axios.get(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`).then(res => {
        setDistricts(res.data.districts || []);
        if (initialDistrict && res.data.districts) {
          const found = res.data.districts.find((d: any) => d.name === initialDistrict || d.name.includes(initialDistrict));
          if (found) setDCode(found.code.toString());
        }
      }).catch(console.error);
    }
  }, [mode, pCode, initialDistrict, initialWard]);

  // 3. Fetch wards when district changes (only for old mode)
  useEffect(() => {
    if (mode === 'old') {
      if (dCode) {
        axios.get(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`).then(res => {
          setWards(res.data.wards || []);
          if (initialWard && res.data.wards) {
            const found = res.data.wards.find((w: any) => w.name === initialWard || w.name.includes(initialWard));
            if (found) setWCode(found.code.toString());
          }
        }).catch(console.error);
      } else {
        setWards([]);
        setWCode('');
      }
    }
  }, [mode, dCode, initialWard]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setPCode(code);
    setPName(code ? name : '');
    
    // Reset children
    setDCode(''); setDName('');
    setWCode(''); setWName('');
    onChange(code ? name : '', '', '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setDCode(code);
    setDName(code ? name : '');
    
    // Reset children
    setWCode(''); setWName('');
    onChange(pName, code ? name : '', '');
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setWCode(code);
    setWName(code ? name : '');
    onChange(pName, mode === 'new' ? '' : dName, code ? name : '');
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <select 
        value={pCode} 
        onChange={handleProvinceChange}
        className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500 bg-white"
      >
        <option value="">Chọn Tỉnh/Thành phố</option>
        {provinces.map(p => (
          <option key={p.code} value={p.code}>{p.name}</option>
        ))}
      </select>

      {mode === 'old' && (
        <select 
          value={dCode} 
          onChange={handleDistrictChange}
          disabled={!pCode}
          className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500 bg-white disabled:bg-stone-100 disabled:cursor-not-allowed"
        >
          <option value="">Chọn Quận/Huyện</option>
          {districts.map(d => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      )}

      <select 
        value={wCode} 
        onChange={handleWardChange}
        disabled={mode === 'new' ? !pCode : !dCode}
        className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500 bg-white disabled:bg-stone-100 disabled:cursor-not-allowed"
      >
        <option value="">Chọn {mode === 'new' ? 'Đơn vị hành chính cấp Xã/Phường' : 'Phường/Xã'}</option>
        {wards.map(w => (
          <option key={w.code} value={w.code}>{w.name}</option>
        ))}
      </select>
    </div>
  );
}
