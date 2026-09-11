import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { CartDrawer } from './layout/cart-drawer/cart-drawer';
import { AccountModal } from './layout/account-modal/account-modal';
import { ToastHost } from './layout/toast-host/toast-host';

@Component({
  imports: [RouterOutlet, Header, Footer, CartDrawer, AccountModal, ToastHost],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
