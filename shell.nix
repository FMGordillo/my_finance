let
  pkgs = import <nixpkgs> {};
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    pkg-config
    cargo
    openssl # For Prisma
    nodejs_18
    protobuf
    nodePackages.pnpm
  ];
}
