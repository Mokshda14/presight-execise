const filterParams = [
  {
    name: 'q',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description:
      'Case-insensitive substring match on first_name, last_name, or the full "first last" name. Surrounding whitespace is trimmed; internal whitespace runs collapse to one space. Literal % and _ are matched literally.',
    example: 'aaliyah led',
  },
  {
    name: 'nationalities',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description:
      'Comma-separated list. Matches users whose nationality is ANY of the values (OR). Duplicates are ignored.',
    example: 'French,German',
  },
  {
    name: 'hobbies',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description:
      'Comma-separated list. Matches users who have ALL of the values (AND). Duplicates are ignored.',
    example: 'Chess,Reading',
  },
] as const;

const errorResponse = {
  description: 'Validation error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
} as const;

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'User Directory API',
    version: '1.0.0',
    description:
      'Searchable, filterable, paginated user directory backed by SQLite. ' +
      'Text, hobby, and nationality filters combine with AND. ' +
      'All list ordering is deterministic (id tie-break).',
  },
  servers: [{ url: '/', description: 'Same origin' }],
  tags: [
    { name: 'users', description: 'Paginated, filtered, sorted user list' },
    { name: 'facets', description: 'Top-20 filter options scoped to the active filters' },
  ],
  paths: {
    '/api/users': {
      get: {
        tags: ['users'],
        summary: 'List users',
        description:
          'Paginated user results honoring the shared filter params plus sort/pagination. ' +
          'Sorting is deterministic: every order ends with id in the same direction.',
        parameters: [
          ...filterParams,
          {
            name: 'sort',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['first_name', 'last_name', 'age', 'nationality'],
              default: 'first_name',
            },
          },
          {
            name: 'dir',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: '1-based page number.',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          },
        ],
        responses: {
          '200': {
            description: 'One page of users plus pagination metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsersResponse' },
              },
            },
          },
          '400': errorResponse,
        },
      },
    },
    '/api/facets': {
      get: {
        tags: ['facets'],
        summary: 'Top-20 hobbies and nationalities for the active filters',
        description:
          'Counts reflect the currently applied filters, not the global dataset. ' +
          'Own-facet exclusion: nationality counts ignore the selected nationalities ' +
          '(so the OR group stays expandable) while respecting q and hobbies; ' +
          'hobby counts are computed within the fully narrowed result set. ' +
          'Ordering: count DESC, then value ASC.',
        parameters: [...filterParams],
        responses: {
          '200': {
            description: 'Top-20 facet values with counts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FacetsResponse' },
              },
            },
          },
          '400': errorResponse,
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'avatar', 'first_name', 'last_name', 'age', 'nationality', 'hobbies'],
        properties: {
          id: { type: 'integer', example: 42 },
          avatar: {
            type: 'string',
            format: 'uri',
            example: 'https://api.dicebear.com/10.x/clay/svg?seed=41',
          },
          first_name: { type: 'string', example: 'Aaliyah' },
          last_name: { type: 'string', example: 'Ledner' },
          age: { type: 'integer', minimum: 18, maximum: 80, example: 21 },
          nationality: { type: 'string', example: 'Kenyan' },
          hobbies: {
            type: 'array',
            items: { type: 'string' },
            description: '0-10 hobby names, alphabetical',
            example: ['Skiing', 'Snowboarding'],
          },
        },
      },
      UsersResponse: {
        type: 'object',
        required: ['users', 'page', 'limit', 'total', 'hasMore'],
        properties: {
          users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 25 },
          total: {
            type: 'integer',
            description: 'Count for the active filter set',
            example: 3120,
          },
          hasMore: {
            type: 'boolean',
            description: 'True when page * limit < total',
            example: true,
          },
        },
      },
      FacetValue: {
        type: 'object',
        required: ['value', 'count'],
        properties: {
          value: { type: 'string', example: 'Chess' },
          count: { type: 'integer', example: 412 },
        },
      },
      FacetsResponse: {
        type: 'object',
        required: ['hobbies', 'nationalities'],
        properties: {
          hobbies: {
            type: 'array',
            maxItems: 20,
            items: { $ref: '#/components/schemas/FacetValue' },
          },
          nationalities: {
            type: 'array',
            maxItems: 20,
            items: { $ref: '#/components/schemas/FacetValue' },
          },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Invalid request' },
          details: {
            type: 'array',
            description: 'Present on validation failures: one entry per invalid param',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: 'sort' },
                message: { type: 'string', example: 'Invalid option' },
              },
            },
          },
        },
      },
    },
  },
} as const;
