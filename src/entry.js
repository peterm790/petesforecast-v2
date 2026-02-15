const isPolarRoute =
  window.location.pathname === '/polars' ||
  window.location.pathname === '/polars/';

if (isPolarRoute) {
  import('./polars/index.js');
} else {
  import('./index.js');
}
