# Segurança e escopo

Este projeto é independente da OpenAI, do Steam e do Wallpaper Engine. Não afirma ter permissão contratual para modificar o Codex nem garante proteção contra restrições ou suspensão da conta. A licença MIT cobre o código deste projeto, não o aplicativo da OpenAI nem as imagens de terceiros.

O atalho habilita a depuração local do Electron. Esse canal permite executar JavaScript no renderizador: **nunca o exponha à rede nem compartilhe o acesso**. O auxiliar verifica o proprietário da porta, o pacote oficial, o endereço de loopback e a identidade do navegador. Essas verificações reduzem erros de destino; a depuração não é uma barreira de segurança contra outro processo local com as mesmas permissões.

O indicador do perfil lê a consulta de uso nativa e solicita uma atualização a cada 30 segundos quando a janela está visível e o dado está antigo. Não faz autenticação separada, não salva nem exporta esse dado e não lê conversas, cookies ou credenciais. Os arquivos importados são tratados como mídia; scripts, páginas web e cenas do Workshop não são executados.

Uma atualização do aplicativo pode alterar seletores ou comportamento. Bugs podem afetar a leitura, o desempenho ou os controles. Se a aplicação falhar, o Codex continua aberto. Não são usados ciclos de reinicialização nem alterações no pacote instalado do Codex para recuperação.

Não publique arquivos de endpoint, logs sem revisão, conversas, caminhos pessoais ou mídia protegida em issues. Informe as versões do aplicativo e do mod e os passos mínimos para reproduzir o problema. Para relatos de segurança, use um canal privado disponibilizado pelo mantenedor do repositório.
