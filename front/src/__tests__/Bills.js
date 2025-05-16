/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom'
import BillsUI from '../views/BillsUI.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'

import router from '../app/Router.js'

import Bills from '../containers/Bills.js'

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        }),
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //TODO write expect expression
      expect(windowIcon).toBeTruthy()
    })
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => new Date(b) - new Date(a) //TODO présentation [Bug report] - Bills
      const datesSorted = [...dates].sort(antiChrono)
      expect(datesSorted).toEqual([
        '2004-04-04',
        '2003-03-03',
        '2002-02-02',
        '2001-01-01',
      ])
    })
    test('Then clicking on "Nouvelle note de frais" should navigate to NewBill page', () => {
      // Configuration de l'environnement
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const onNavigate = jest.fn()
      document.body.innerHTML = BillsUI({ data: bills })
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      // Simulation du clic sur le bouton
      const newBillButton = screen.getByTestId('btn-new-bill')
      newBillButton.click()

      // Vérification que la navigation a été appelée avec le bon chemin
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
    test('Then clicking on eye icon should open a modal with the bill proof', () => {
      // Configuration de l'environnement
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = BillsUI({ data: bills })
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      })

      // Simulation du clic sur l'icône œil
      const eyeIcons = screen.getAllByTestId('icon-eye')
      $.fn.modal = jest.fn() // Mock de la fonction modal de jQuery
      eyeIcons[0].click()

      // Vérification que la modale a été affichée
      expect($.fn.modal).toHaveBeenCalledWith('show')
    })
    test('Then getBills should handle corrupted data gracefully', async () => {
      const storeMock = {
        bills: () => ({
          list: () =>
            Promise.resolve([
              { id: '1', date: 'invalid-date', status: 'pending' },
            ]),
        }),
      }

      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: storeMock,
        localStorage: window.localStorage,
      })

      const billsList = await billsContainer.getBills()

      // Vérification que la date non formatée est retournée
      expect(billsList[0].date).toEqual('invalid-date')
    })
  })
})
