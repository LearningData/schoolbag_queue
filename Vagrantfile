# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.hostname = "development"
  config.vm.network "forwarded_port", guest: 8000, host: 8000
  config.vm.network "forwarded_port", guest: 80, host: 7002
  config.vm.network "forwarded_port", guest: 3306, host: 3308

  config.vm.synced_folder "../../", "/Projects"

  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "#{File.dirname(__FILE__)}/dependencies/development.yml"
    ansible.limit = 'all'
  end
end
