import { http, HttpResponse } from 'msw';

const CL_2026_HOLIDAYS = [
    { date: '2026-01-01', localName: 'Año Nuevo', name: "New Year's Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-04-03', localName: 'Viernes Santo', name: 'Good Friday', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-04-04', localName: 'Sábado Santo', name: 'Holy Saturday', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-05-01', localName: 'Día del Trabajo', name: 'Labour Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-05-21', localName: 'Día de las Glorias Navales', name: 'Navy Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-06-07', localName: 'Asalto y Toma del Morro de Arica', name: 'Battle of Arica Day', countryCode: 'CL', global: false, counties: ['CL-AP'], types: ['Public'] },
    { date: '2026-06-29', localName: 'San Pedro y San Pablo', name: 'Saints Peter and Paul', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-07-16', localName: 'Día de la Virgen del Carmen', name: 'Our Lady of Mount Carmel', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-08-15', localName: 'Asunción de la Virgen', name: 'Assumption of Mary', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-09-18', localName: 'Independencia Nacional', name: 'National Independence', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-09-19', localName: 'Glorias del Ejército', name: 'Army Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-10-12', localName: 'Encuentro de Dos Mundos', name: 'Columbus Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-10-31', localName: 'Día de las Iglesias Evangélicas', name: 'Reformation Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-11-01', localName: 'Día de Todos los Santos', name: "All Saints' Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-12-08', localName: 'Inmaculada Concepción', name: 'Immaculate Conception', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-12-25', localName: 'Navidad', name: 'Christmas Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
];

const CL_2027_HOLIDAYS = [
    { date: '2027-01-01', localName: 'Año Nuevo', name: "New Year's Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-03-26', localName: 'Viernes Santo', name: 'Good Friday', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-03-27', localName: 'Sábado Santo', name: 'Holy Saturday', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-05-01', localName: 'Día del Trabajo', name: 'Labour Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-05-21', localName: 'Día de las Glorias Navales', name: 'Navy Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-06-28', localName: 'San Pedro y San Pablo', name: 'Saints Peter and Paul', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-07-16', localName: 'Día de la Virgen del Carmen', name: 'Our Lady of Mount Carmel', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-08-15', localName: 'Asunción de la Virgen', name: 'Assumption of Mary', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-09-18', localName: 'Independencia Nacional', name: 'National Independence', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-09-19', localName: 'Glorias del Ejército', name: 'Army Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-10-11', localName: 'Encuentro de Dos Mundos', name: 'Columbus Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-10-31', localName: 'Día de las Iglesias Evangélicas', name: 'Reformation Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-11-01', localName: 'Día de Todos los Santos', name: "All Saints' Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-12-08', localName: 'Inmaculada Concepción', name: 'Immaculate Conception', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2027-12-25', localName: 'Navidad', name: 'Christmas Day', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
];

export const handlers = [
    http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', ({ params }) => {
        const year = parseInt(params.year);
        if (year === 2026) return HttpResponse.json(CL_2026_HOLIDAYS);
        if (year === 2027) return HttpResponse.json(CL_2027_HOLIDAYS);
        return HttpResponse.json([]);
    }),
];
