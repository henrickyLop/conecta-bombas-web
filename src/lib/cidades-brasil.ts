// Cidades do Brasil organizadas por estado
// Usado no cadastro do dono da bomba e na busca do cliente

export const CIDADES_BRASIL: Record<string, string[]> = {
  'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó'],
  'AL': ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'Penedo', 'Delmiro Gouveia', 'Coruripe'],
  'AM': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tabatinga', 'Tefé'],
  'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande'],
  'BA': [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
    'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
    'Barreiras', 'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso',
    'Eunápolis', 'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Guanambi',
    'Senhor do Bonfim', 'Dias d\'Ávila', 'Luís Eduardo Magalhães', 'Itapetinga',
    'Irecê', 'Campo Formoso', 'Casa Nova', 'Brumado', 'Bom Jesus da Lapa'
  ],
  'CE': [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
    'Canindé', 'Pacatuba', 'Aquiraz', 'Russas', 'Aracati',
    'Crateús', 'Tianguá', 'Cascavel', 'Morada Nova', 'Camocim'
  ],
  'DF': ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina', 'Gama', 'Águas Claras'],
  'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz'],
  'GO': [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Águas Lindas de Goiás',
    'Luziânia', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama',
    'Itumbiara', 'Senador Canedo', 'Jataí', 'Planaltina', 'Catalão',
    'Inhumas', 'Goianésia', 'Jaraguá', 'Mineiros', 'Caldas Novas'
  ],
  'MA': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Pinheiro', 'Chapadinha'],
  'MG': [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares',
    'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité',
    'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni',
    'Barbacena', 'Varginha', 'Conselheiro Lafaiete', 'Itabira', 'Muriaé',
    'Araguari', 'Passos', 'Caratinga', 'Nova Lima', 'Coronel Fabriciano',
    'Manhuaçu', 'Unaí', 'Timóteo', 'Curvelo', 'Janaúba', 'Pará de Minas'
  ],
  'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Aquidauana', 'Naviraí', 'Nova Andradina', 'Paranaíba', 'Maracaju'],
  'MT': [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra',
    'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste',
    'Alta Floresta', 'Barra do Garças', 'Primavera do Leste', 'Juara', 'Campo Verde'
  ],
  'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal', 'Parauapebas', 'Itaituba', 'Cametá', 'Bragança', 'Tucuruí', 'Altamira', 'Paragominas', 'Abaetetuba'],
  'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Guarabira', 'Cabedelo', 'Mamanguape'],
  'PE': [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina',
    'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns',
    'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe',
    'Ipojuca', 'Serra Talhada', 'Araripina', 'Gravatá', 'Belo Jardim', 'Goiana'
  ],
  'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Barras', 'Esperantina', 'Campo Maior', 'União', 'Altos', 'Oeiras', 'Água Branca'],
  'PR': [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava',
    'Paranaguá', 'Arapongas', 'Almirante Tamandaré', 'Pato Branco',
    'Campo Largo', 'Fazenda Rio Grande', 'Toledo', 'Apucarana',
    'Pinhais', 'Cambé', 'Campo Mourão', 'Telêmaco Borba', 'Medianeira',
    'Francisco Beltrão', 'Umuarama', 'Sarandi', 'Cornélio Procópio'
  ],
  'RJ': [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói',
    'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis',
    'Volta Redonda', 'Magé', 'Macaé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis',
    'Mesquita', 'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Maricá',
    'Araruama', 'Itaguaí', 'Queimados', 'Resende', 'São Pedro da Aldeia'
  ],
  'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'Nova Cruz', 'Pau dos Ferros'],
  'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Jaru', 'Machadinho d\'Oeste', 'Guajará-Mirim', 'Buritis'],
  'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Mucajaí', 'Alto Alegre', 'Bonfim', 'Pacaraima', 'Normandia'],
  'RS': [
    'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
    'Alvorada', 'Passo Fundo', 'Uruguaiana', 'Santa Cruz do Sul',
    'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba', 'Cachoeirinha',
    'Santa Rosa', 'Ijuí', 'Alegrete', 'Lajeado', 'Farroupilha',
    'Santo Ângelo', 'Venâncio Aires', 'Sapucaia do Sul', 'Panambi'
  ],
  'SC': [
    'Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó',
    'Itajaí', 'Criciúma', 'Palhoça', 'Lages', 'Jaraguá do Sul',
    'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul',
    'Caçador', 'Concórdia', 'Rio do Sul', 'Araranguá', 'Gaspar',
    'Navegantes', 'Xanxerê', 'Indaial', 'Canoinhas', 'Videira'
  ],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias', 'Propriá', 'Poço Redondo'],
  'SP': [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
    'Osasco', 'Ribeirão Preto', 'Sorocaba', 'São José dos Campos', 'Mauá',
    'Santos', 'Mogi das Cruzes', 'Diadema', 'Jundiaí', 'Carapicuíba',
    'Piracicaba', 'Bauru', 'São Vicente', 'Itaquaquecetuba', 'Franca',
    'Guarujá', 'Taubaté', 'Praia Grande', 'Limeira', 'Suzano',
    'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes', 'São Carlos',
    'Marília', 'Indaiatuba', 'Cotia', 'Americana', 'Jacareí',
    'Araraquara', 'Rio Claro', 'Presidente Prudente', 'Ferraz de Vasconcelos',
    'Itapevi', 'Hortolândia', 'Araçatuba', 'Santa Bárbara d\'Oeste',
    'Francisco Morato', 'Itu', 'Bragança Paulista', 'Pindamonhangaba',
    'São Caetano do Sul', 'Atibaia', 'Salto', 'Catanduva', 'Birigui',
    'Araras', 'Votorantim', 'Mogi Guaçu', 'Botucatu', 'Jaú',
    'Franco da Rocha', 'Ourinhos', 'Assis', 'Várzea Paulista', 'Jandira',
    'Leme', 'Bebedouro', 'Matão', 'Porto Feliz', 'Tatuí', 'Lorena',
    'Valinhos', 'Mococa', 'Paulínia', 'Itatiba', 'Votuporanga',
    'Amparo', 'Registro', 'Ilhabela', 'Ibitinga', 'Lins', 'Penápolis',
    'Guaíra', 'Olímpia', 'Sertãozinho', 'Batatais', 'Casa Branca',
    'Descalvado', 'São João da Boa Vista', 'Pirassununga', 'Rio das Pedras',
    'São José do Rio Preto', 'Adamantina', 'Dracena', 'Tucuruí', 'Mococa'
  ],
  'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Franco', 'Paraíso do Tocantins', 'Dianópolis', 'Miracema do Tocantins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis']
};

// List all cities flat for autocomplete
export function getAllCities(): string[] {
  return Object.values(CIDADES_BRASIL).flat().sort();
}

// Get cities for a specific state
export function getCidadesPorEstado(estado: string): string[] {
  return CIDADES_BRASIL[estado]?.sort() || [];
}
