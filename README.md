# GetMoney 💰

A React/TypeScript application for searching California's unclaimed property database to help people find money that belongs to them.

## Features

- **🔍 Name-Based Search**: Search for unclaimed property by owner name
- **🎛️ Advanced Filters**: Filter by amount range, city, and property type
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⚡ Real-time Search**: Instant search results as you type
- **🎨 Modern UI**: Built with Material-UI for a beautiful user experience

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **State Management**: MobX
- **UI Framework**: Material-UI (MUI)
- **Build Tool**: Vite
- **Hosting**: Netlify (planned)

## Data Source

The application processes data from California's State Controller's Office unclaimed property database:
- Data URL: https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip
- Update Schedule: Files are updated every Thursday
- Coverage: Properties valued at $500 and above

## Getting Started

### Prerequisites

- Node.js 20.19.0 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd getmoney
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── MainLayout.tsx   # Main application layout
│   ├── SearchSection.tsx # Search input and filters
│   └── ResultsSection.tsx # Search results display
├── stores/              # MobX stores
│   ├── PropertyStore.ts # Property data and search logic
│   ├── RootStore.ts     # Root store combining all stores
│   └── StoreContext.tsx # React context for stores
├── types/               # TypeScript type definitions
│   └── Property.ts      # Property data interfaces
├── utils/               # Utility functions
│   ├── sampleData.ts    # Sample data for testing
│   └── dataProcessor.ts # CSV data processing utilities
└── App.tsx              # Main application component
```

## Data Processing

The application includes utilities to process California's unclaimed property CSV files:

- **CSV Parser**: Handles quoted fields and escaped characters
- **Data Transformer**: Converts CSV rows to TypeScript objects
- **Type Mapping**: Maps property type codes to descriptions

## Search Features

### Basic Search
- Search by full name or partial name
- Case-insensitive matching
- Real-time results

### Advanced Filters
- **Amount Range**: Filter by minimum and maximum dollar amounts
- **City**: Filter by owner's city
- **Property Type**: Filter by specific property categories

## Property Types

The application recognizes various types of unclaimed property:
- Bank accounts (checking, savings, CDs)
- Insurance benefits and policies
- Dividends and investment proceeds
- Wages and commissions
- Cashier's checks and money orders
- Safe deposit box contents

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- TypeScript for type safety
- ESLint for code quality
- Strict mode enabled

## Deployment

The application is designed to be deployed on Netlify:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure build settings in Netlify dashboard

## Future Enhancements

- **Automated Data Updates**: Weekly data downloads and processing
- **Enhanced Search**: Fuzzy matching and phonetic search
- **Data Export**: CSV/PDF export of search results
- **Analytics**: Search statistics and popular queries
- **Claim Assistance**: Direct links to claim processes

## Legal Notice

This application is for informational purposes only. Users should contact the California State Controller's Office directly to claim any unclaimed property. Always verify information through official channels before taking action.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue in the GitHub repository.

---

**Disclaimer**: This application is not affiliated with the California State Controller's Office. It is an independent tool designed to help people search for unclaimed property using publicly available data.
