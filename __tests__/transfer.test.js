import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Transfer from '../pages/transfer';

const mockSilos = [
    { id: 1, location: 'HQ-1', weight: 1000, moisture: 12.5, lot_number: '["23MB"]', product: '["TRIT"]' },
    { id: 2, location: 'HQ-3', weight: 500, moisture: 12.8, lot_number: '["25MB"]', product: '["YC"]' },
    { id: 3, location: 'Co2-3', weight: 800, moisture: 13.2, lot_number: '["24FS"]', product: '["WC"]' },
];

const mockSelect = {
    select: jest.fn().mockResolvedValue({ data: mockSilos, error: null }),
};

const mockUpdateChain = {
    eq: jest.fn(() => Promise.resolve({ error: null })),
};

const mockSupabase = {
    from: jest.fn().mockImplementation((tableName) => {
        return {
            select: mockSelect.select,
            update: jest.fn().mockReturnThis(),
            eq: mockUpdateChain.eq,
        };
    }),
};

jest.mock('@supabase/auth-helpers-react', () => ({
    useSupabaseClient: jest.fn(() => mockSupabase),
}));

jest.mock('../components/layout', () => ({
    __esModule: true,
    default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

describe('Transfer Page', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();

        mockSelect.select.mockResolvedValue({ data: mockSilos, error: null });
        mockUpdateChain.eq.mockImplementation(() => Promise.resolve({ error: null }));
    });

    const setupWithLoadedSilos = async () => {
        render(<Transfer />);

        await waitFor(() => {
            expect(screen.getAllByRole('option', { name: 'HQ-1' })).toHaveLength(2); 
        });

        const fromSelect = screen.getByRole('combobox', { name: /from silo/i });
        const toSelect = screen.getByRole('combobox', { name: /to silo/i });

        await user.selectOptions(fromSelect, 'HQ-1');
        await user.selectOptions(toSelect, 'HQ-3');

        await waitFor(() => {
            expect(screen.getByText('Source: HQ-1')).toBeInTheDocument();
            expect(screen.getByText('Destination: HQ-3')).toBeInTheDocument();
        });

        expect(screen.getByRole('spinbutton', { name: /weight to transfer/i })).not.toBeDisabled();
    };

    it('shows loading state initially', () => {
        mockSelect.select.mockImplementation(() => new Promise(() => {}));
        render(<Transfer />);
        expect(screen.getByText(/Loading silos/i)).toBeInTheDocument();
    });

    it('loads and displays silos', async () => {
        render(<Transfer />);
        await waitFor(() => expect(screen.getAllByRole('option', { name: 'HQ-1' })).toHaveLength(2));
    });

    it('shows preview when valid transfer is configured', async () => {
        await setupWithLoadedSilos();
        await user.type(screen.getByRole('spinbutton', { name: /weight to transfer/i }), '300');

        expect(screen.getByText(/Preview/i)).toBeInTheDocument(); 
    });

    it('toggles "Transfer All" and removes weight input', async () => {

        await setupWithLoadedSilos();

        await user.click(screen.getByLabelText(/transfer everything/i));

        expect(screen.queryByRole('spinbutton', { name: /weight to transfer/i })).not.toBeInTheDocument();

    });

    it('executes transfer successfully', async () => {
        const initialSiloData = [
            { id: 1, location: 'HQ-1', weight: 1000, moisture: 13.5, lot_number: '["23MB"]', product: '["TRIT"]' },
            { id: 2, location: 'HQ-3', weight: 500, moisture: 12.0, lot_number: '["25MB"]', product: '["YC"]' },
            { id: 3, location: 'Co2-3', weight: 200, moisture: 14.0, lot_number: '["24FS"]', product: '["WC"]' },
        ];

        const updatedSiloData = [
            { id: 1, location: 'HQ-1', weight: 600, moisture: 13.5, lot_number: '["23MB"]', product: '["TRIT"]' }, // 1000 - 400 = 600
            { id: 2, location: 'HQ-3', weight: 900, moisture: 12.5, lot_number: '["25MB", "23MB"]', product: '["YC", "TRIT"]' }, // 500 + 400 = 900
            { id: 3, location: 'Co2-3', weight: 200, moisture: 14.0, lot_number: '["24FS"]', product: '["WC"]' },
        ];
        
        mockSelect.select.mockResolvedValueOnce({ data: initialSiloData, error: null });

        mockUpdateChain.eq.mockImplementationOnce(() => Promise.resolve({ error: null })); 
        mockUpdateChain.eq.mockImplementationOnce(() => Promise.resolve({ error: null }));

        mockSelect.select.mockResolvedValueOnce({ data: updatedSiloData, error: null });
        
        render(<Transfer />);

        const fromSiloSelect = await screen.findByLabelText(/from silo/i);
        const toSiloSelect = screen.getByLabelText(/to silo/i);

        await within(fromSiloSelect).findByRole('option', { name: 'HQ-1' });

        await user.selectOptions(fromSiloSelect, 'HQ-1');
        await user.selectOptions(toSiloSelect, 'HQ-3');

        const weightInput = screen.getByRole('spinbutton', { name: /weight to transfer/i });
        const moistureInput = screen.getByLabelText(/destination moisture/i, { selector: 'input' });
        const executeButton = screen.getByText('Execute Transfer');

        await user.clear(weightInput);
        await user.type(weightInput, '400'); 
        await user.type(moistureInput, '12.5'); 

        await user.click(executeButton);

        await waitFor(() => {
            expect(mockUpdateChain.eq).toHaveBeenCalledTimes(2); 
            expect(mockSelect.select).toHaveBeenCalledTimes(2); 
        });
        
    }, 10000);

    it('shows error when source and destination are the same', async () => {
        render(<Transfer />);
        await waitFor(() => expect(screen.getAllByRole('option', { name: 'HQ-1' })).toHaveLength(2));
        
        const fromSelect = screen.getByRole('combobox', { name: /from silo/i });
        const toSelect = screen.getByRole('combobox', { name: /to silo/i });
        
        await user.selectOptions(fromSelect, 'HQ-1');
        await user.selectOptions(toSelect, 'HQ-1'); 
        await waitFor(() => expect(screen.getByText('Source: HQ-1')).toBeInTheDocument());

        await user.type(screen.getByRole('spinbutton', { name: /weight to transfer/i }), '100');
        await user.click(screen.getByText('Execute Transfer'));
        await waitFor(() => expect(screen.getByText(/must be different/i)).toBeInTheDocument());
    });

    it('shows error when weight exceeds available', async () => {
        render(<Transfer />);
        await waitFor(() => expect(screen.getAllByRole('option', { name: 'HQ-3' })).toHaveLength(2));
        
        const fromSelect = screen.getByRole('combobox', { name: /from silo/i });
        const toSelect = screen.getByRole('combobox', { name: /to silo/i });
        
        await user.selectOptions(fromSelect, 'HQ-3'); 
        await user.selectOptions(toSelect, 'Co2-3');
        await waitFor(() => expect(screen.getByText('Source: HQ-3')).toBeInTheDocument());

        await user.type(screen.getByRole('spinbutton', { name: /weight to transfer/i }), '999');
        await user.click(screen.getByText('Execute Transfer'));
        await waitFor(() => expect(screen.getByText(/more than available/i)).toBeInTheDocument());
    });

    it('shows error when weight is zero or empty', async () => {
        await setupWithLoadedSilos(); 

        await user.click(screen.getByText('Execute Transfer'));
        await waitFor(() => expect(screen.getByText(/valid transfer weight/i)).toBeInTheDocument());
    });
});