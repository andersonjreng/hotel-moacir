import { Injectable } from "@angular/core";
import { User } from "@angular/fire/auth";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { LoginService } from "../services/login.service";
import {CanActivate} from "@angular/router";




@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  user!: User;

  constructor(
    private authService: LoginService,
    private router: Router,
  ) {}


canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  const token = sessionStorage.getItem('token');
  if (token && this.authService.isTokenValid(token)) {
      return true;
  } else {
      console.log('Token inválido, redirecionando para /login.');
      this.router.navigate(['/login']);
      return false;
  }
}
}
