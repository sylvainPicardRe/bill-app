/**
 * @jest-environment jsdom
 */
import { screen, fireEvent } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { ROUTES_PATH } from '../constants/routes.js'
import mockStore from '../__mocks__/store.js'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => JSON.stringify({ email: 'employee@test.tld' })),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
})

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    let newBill

    beforeEach(() => {
      document.body.innerHTML = NewBillUI()

      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      })
    })

    test('Then the form should be rendered', () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    test('Then file change with good extension should call store.bills().create', async () => {
      const file = new File(['img'], 'image.png', { type: 'image/png' })
      const inputFile = screen.getByTestId('file')

      const mockCreate = jest.spyOn(mockStore.bills(), 'create')

      await fireEvent.change(inputFile, {
        target: { files: [file] },
      })

      expect(mockCreate).toHaveBeenCalled()
    })

    test('Then file change with wrong extension should trigger alert and not call store', async () => {
      const file = new File(['doc'], 'file.txt', { type: 'text/plain' })
      const inputFile = screen.getByTestId('file')

      window.alert = jest.fn()
      await fireEvent.change(inputFile, {
        target: { files: [file] },
      })

      expect(window.alert).toHaveBeenCalledWith(
        'Veuillez sélectionner un fichier avec une extension valide (.jpg, .jpeg, .png).',
      )
    })

    test('Then submitting the form should call updateBill and navigate', () => {
      const form = screen.getByTestId('form-new-bill')

      screen.getByTestId('expense-type').value = 'Transports'
      screen.getByTestId('expense-name').value = 'Taxi'
      screen.getByTestId('amount').value = '30'
      screen.getByTestId('datepicker').value = '2023-05-10'
      screen.getByTestId('vat').value = '20'
      screen.getByTestId('pct').value = '20'
      screen.getByTestId('commentary').value = 'Trajet client'

      newBill.fileUrl = 'https://someurl.com/image.png'
      newBill.fileName = 'image.png'
      newBill.billId = '1234'

      const mockUpdateBill = jest.spyOn(newBill, 'updateBill')

      fireEvent.submit(form)

      expect(mockUpdateBill).toHaveBeenCalled()
      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
    })
  })
})
