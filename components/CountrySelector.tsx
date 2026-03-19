"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
const countries = [
  { code: "US", name: "United States", flag: "https://flagcdn.com/w320/us.png" },

  { code: "AR", name: "Argentina", flag: "https://flagcdn.com/w320/ar.png" },
  { code: "AU", name: "Australia", flag: "https://flagcdn.com/w320/au.png" },
  { code: "AT", name: "Austria", flag: "https://flagcdn.com/w320/at.png" },
  { code: "BE", name: "Belgium", flag: "https://flagcdn.com/w320/be.png" },
  { code: "BR", name: "Brazil", flag: "https://flagcdn.com/w320/br.png" },
  { code: "BG", name: "Bulgaria", flag: "https://flagcdn.com/w320/bg.png" },
  { code: "CA", name: "Canada", flag: "https://flagcdn.com/w320/ca.png" },
  { code: "CL", name: "Chile", flag: "https://flagcdn.com/w320/cl.png" },
  { code: "CN", name: "China", flag: "https://flagcdn.com/w320/cn.png" },
  { code: "CO", name: "Colombia", flag: "https://flagcdn.com/w320/co.png" },
  { code: "HR", name: "Croatia", flag: "https://flagcdn.com/w320/hr.png" },
  { code: "CY", name: "Cyprus", flag: "https://flagcdn.com/w320/cy.png" },
  { code: "CZ", name: "Czech Republic", flag: "https://flagcdn.com/w320/cz.png" },
  { code: "DK", name: "Denmark", flag: "https://flagcdn.com/w320/dk.png" },
  { code: "EG", name: "Egypt", flag: "https://flagcdn.com/w320/eg.png" },
  { code: "EE", name: "Estonia", flag: "https://flagcdn.com/w320/ee.png" },
  { code: "FI", name: "Finland", flag: "https://flagcdn.com/w320/fi.png" },
  { code: "FR", name: "France", flag: "https://flagcdn.com/w320/fr.png" },
  { code: "DE", name: "Germany", flag: "https://flagcdn.com/w320/de.png" },
  { code: "GR", name: "Greece", flag: "https://flagcdn.com/w320/gr.png" },
  { code: "HK", name: "Hong Kong", flag: "https://flagcdn.com/w320/hk.png" },
  { code: "HU", name: "Hungary", flag: "https://flagcdn.com/w320/hu.png" },
  { code: "IS", name: "Iceland", flag: "https://flagcdn.com/w320/is.png" },
  { code: "IN", name: "India", flag: "https://flagcdn.com/w320/in.png" },
  { code: "ID", name: "Indonesia", flag: "https://flagcdn.com/w320/id.png" },
  { code: "IE", name: "Ireland", flag: "https://flagcdn.com/w320/ie.png" },
  { code: "IT", name: "Italy", flag: "https://flagcdn.com/w320/it.png" },
  { code: "JP", name: "Japan", flag: "https://flagcdn.com/w320/jp.png" },
  { code: "KR", name: "South Korea", flag: "https://flagcdn.com/w320/kr.png" },
  { code: "LV", name: "Latvia", flag: "https://flagcdn.com/w320/lv.png" },
  { code: "LT", name: "Lithuania", flag: "https://flagcdn.com/w320/lt.png" },
  { code: "LU", name: "Luxembourg", flag: "https://flagcdn.com/w320/lu.png" },
  { code: "MY", name: "Malaysia", flag: "https://flagcdn.com/w320/my.png" },
  { code: "MT", name: "Malta", flag: "https://flagcdn.com/w320/mt.png" },
  { code: "MX", name: "Mexico", flag: "https://flagcdn.com/w320/mx.png" },
  { code: "NL", name: "Netherlands", flag: "https://flagcdn.com/w320/nl.png" },
  { code: "NZ", name: "New Zealand", flag: "https://flagcdn.com/w320/nz.png" },
  { code: "NO", name: "Norway", flag: "https://flagcdn.com/w320/no.png" },
  { code: "PE", name: "Peru", flag: "https://flagcdn.com/w320/pe.png" },
  { code: "PH", name: "Philippines", flag: "https://flagcdn.com/w320/ph.png" },
  { code: "PL", name: "Poland", flag: "https://flagcdn.com/w320/pl.png" },
  { code: "PT", name: "Portugal", flag: "https://flagcdn.com/w320/pt.png" },
  { code: "RO", name: "Romania", flag: "https://flagcdn.com/w320/ro.png" },
  { code: "RU", name: "Russia", flag: "https://flagcdn.com/w320/ru.png" },
  { code: "SA", name: "Saudi Arabia", flag: "https://flagcdn.com/w320/sa.png" },
  { code: "SG", name: "Singapore", flag: "https://flagcdn.com/w320/sg.png" },
  { code: "SK", name: "Slovakia", flag: "https://flagcdn.com/w320/sk.png" },
  { code: "SI", name: "Slovenia", flag: "https://flagcdn.com/w320/si.png" },
  { code: "ZA", name: "South Africa", flag: "https://flagcdn.com/w320/za.png" },
  { code: "ES", name: "Spain", flag: "https://flagcdn.com/w320/es.png" },
  { code: "SE", name: "Sweden", flag: "https://flagcdn.com/w320/se.png" },
  { code: "CH", name: "Switzerland", flag: "https://flagcdn.com/w320/ch.png" },
  { code: "TH", name: "Thailand", flag: "https://flagcdn.com/w320/th.png" },
  { code: "TN", name: "Tunisia", flag: "https://flagcdn.com/w2560/tn.png" },
  { code: "TR", name: "Turkey", flag: "https://flagcdn.com/w320/tr.png" },
  { code: "UA", name: "Ukraine", flag: "https://flagcdn.com/w320/ua.png" },
  { code: "AE", name: "United Arab Emirates", flag: "https://flagcdn.com/w320/ae.png" },
  { code: "GB", name: "United Kingdom", flag: "https://flagcdn.com/w320/gb.png" },
  { code: "VN", name: "Vietnam", flag: "https://flagcdn.com/w320/vn.png" }
];
interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

function CountrySelector({
  value,
  onValueChange,
  disabled,
}: CountrySelectorProps) {
    const selectedCountry =
    countries.find((country) => country.code === value) || countries[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="h-14 px-4 justify-between min-w-[140px] border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm"
        >
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
  {/* Replace the span with this img tag */}
  <img 
    src={selectedCountry.flag} 
    alt="" 
    className="w-6 h-4 object-cover rounded-sm" 
  />
  <span className="font-medium">{selectedCountry.code}</span>
</div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[280px] max-h-[300px] overflow-y-auto"
      >
        {countries.map((country) => (
  <DropdownMenuItem
    key={country.code}
    onClick={() => onValueChange(country.code)}
    className="flex items-center gap-3 cursor-pointer"
  >
    {/* Replace the span with this img tag */}
    <img 
      src={country.flag} 
      alt={`${country.name} flag`} 
      className="w-6 h-4 object-cover rounded-sm" 
    />
    <div className="flex flex-col">
      <span className="font-medium">{country.name}</span>
      <span className="text-xs text-muted-foreground">
        {country.code}
      </span>
    </div>
  </DropdownMenuItem>
))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CountrySelector;