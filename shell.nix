let
  pkgs = import <nixpkgs> {};
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    openssl # For Prisma
    nodejs_18
    nodePackages.pnpm
  ];
}
